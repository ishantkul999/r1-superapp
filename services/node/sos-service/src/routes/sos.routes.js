'use strict';
const express = require('express');
const router  = express.Router();
const { Pool } = require('pg');
const { createClient } = require('redis');
const axios = require('axios');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_NODE ||
    `postgresql://${process.env.POSTGRES_USER||'r1user'}:${process.env.POSTGRES_PASSWORD||'r1password'}@${process.env.POSTGRES_HOST||'localhost'}:${process.env.POSTGRES_PORT||5432}/${process.env.POSTGRES_DB||'r1superapp'}`
});

let redis;
(async () => {
  redis = createClient({ url: `redis://:${process.env.REDIS_PASSWORD||'r1redispass'}@${process.env.REDIS_HOST||'localhost'}:${process.env.REDIS_PORT||6379}` });
  redis.on('error', e => console.error('[SOS Redis]', e.message));
  await redis.connect();
})();

const DEFAULT_STATION = '00000000-0000-0000-0000-100000000001';
const INTERNAL_SECRET = process.env.INTERNAL_EVENTS_SECRET || 'dev-internal-secret';
const USER_SVC_URL    = process.env.USER_SERVICE_URL        || 'http://localhost:3001';
const STAFF_ROLES     = ['RPF','STATION_CONTROL_ROOM','SUPERADMIN'];

// ── POST /api/sos/trigger ─────────────────────────────────────────────────────
router.post('/trigger', async (req, res, next) => {
  const t0 = Date.now();
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { alertType = 'GENERAL', description, lat, lng, source = 'APP' } = req.body;
    const ref = 'SOS' + Date.now().toString().slice(-8);

    const { rows } = await pool.query(
      `INSERT INTO sos_svc.alerts
         (alert_reference, user_id, alert_type, description, status, lat, lng, source, station_id)
       VALUES ($1,$2,$3,$4,'ACTIVE',$5,$6,$7,$8) RETURNING *`,
      [ref, userId, alertType, description||null, lat||null, lng||null, source, DEFAULT_STATION]
    );
    const alert = rows[0];

    // Store GPS trail in Redis
    if (lat && lng) {
      const key = `sos:trail:${alert.id}`;
      await redis.rPush(key, JSON.stringify({ lat, lng, ts: Date.now() }));
      await redis.expire(key, 600);
    }

    const io = req.app.get('io');
    if (io) {
      io.to('rpf-room').emit('sos:alert', {
        alertId:        alert.id,
        alertReference: ref,
        userId,
        alertType,
        lat, lng,
        description,
        triggeredAt:    alert.triggered_at,
        alarmSound:     true,   
      });
    }

    notifyContacts(userId, ref, lat, lng).catch(e => console.error('[SOS] contacts notify failed:', e.message));

    res.status(201).json({
      alertId: alert.id, alertReference: ref,
      status: 'ACTIVE',
      message: 'SOS sent. RPF alerted with alarm.',
      responseTimeMs: Date.now() - t0,
    });
  } catch (err) { next(err); }
});

// ── POST /api/sos/:id/location — live GPS stream from passenger ───────────────
router.post('/:alertId/location', async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const { alertId }  = req.params;
    const key = `sos:trail:${alertId}`;
    await redis.rPush(key, JSON.stringify({ lat, lng, ts: Date.now() }));
    await redis.expire(key, 600);

    const io = req.app.get('io');
    if (io) io.to('rpf-room').emit('sos:location_update', { alertId, lat, lng, ts: Date.now() });

    await pool.query(
      `INSERT INTO sos_svc.location_trail (alert_id, lat, lng) VALUES ($1,$2,$3)`,
      [alertId, lat, lng]
    ).catch(() => {});

    res.json({ message: 'Location updated' });
  } catch (err) { next(err); }
});

// ── GET /api/sos/dashboard ────────────────────────────────────────────────────

router.get('/dashboard', async (req, res, next) => {
  try {
    if (!STAFF_ROLES.includes(req.headers['x-user-role'])) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)                                                        AS total,
        COUNT(*) FILTER (WHERE status='ACTIVE')                        AS active,
        COUNT(*) FILTER (WHERE status='RESOLVED')                      AS resolved,
        COUNT(*) FILTER (WHERE triggered_at >= NOW() - INTERVAL '24h') AS last24h,
        COUNT(*) FILTER (WHERE triggered_at >= NOW() - INTERVAL '1h')  AS last_hour,
        COUNT(*) FILTER (WHERE triggered_at >= CURRENT_DATE)           AS today,
        COUNT(*) FILTER (WHERE alert_type='MEDICAL')                   AS medical,
        COUNT(*) FILTER (WHERE alert_type='SECURITY')                  AS security,
        COUNT(*) FILTER (WHERE alert_type='GENERAL')                   AS general
      FROM sos_svc.alerts
    `);
    const r = rows[0];
    res.json({
      total:   parseInt(r.total),   active:  parseInt(r.active),
      resolved:parseInt(r.resolved),last24h: parseInt(r.last24h),
      lastHour:parseInt(r.last_hour),today:  parseInt(r.today),
      byType:{ MEDICAL:parseInt(r.medical), SECURITY:parseInt(r.security), GENERAL:parseInt(r.general) },
    });
  } catch (err) { next(err); }
});

// ── GET /api/sos/active ───────────────────────────────────────────────────────
router.get('/active', async (req, res, next) => {
  try {
    if (!STAFF_ROLES.includes(req.headers['x-user-role'])) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(`SELECT * FROM sos_svc.alerts WHERE status='ACTIVE' ORDER BY triggered_at DESC`);
    if (!rows.length) return res.json([]);

    try {
      const { data: profiles } = await axios.post(
        `${USER_SVC_URL}/internal/users/batch`,
        { userIds: [...new Set(rows.map(r => r.user_id))] },
        { headers:{ 'X-Internal-Secret': INTERNAL_SECRET }, timeout:2000 }
      );
      const map = {};
      (profiles||[]).forEach(p => { map[p.userId] = p; });
      return res.json(rows.map(r => ({ ...r, userName: map[r.user_id]?.name||null, userPhone: map[r.user_id]?.phone||null })));
    } catch { return res.json(rows); }
  } catch (err) { next(err); }
});

// ── GET /api/sos/my ───────────────────────────────────────────────────────────
router.get('/my', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM sos_svc.alerts WHERE user_id=$1 ORDER BY triggered_at DESC LIMIT 20`,
      [req.headers['x-user-id']]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// ── PUT /api/sos/:id/resolve ──────────────────────────────────────────────────
router.put('/:alertId/resolve', async (req, res, next) => {
  try {
    if (!STAFF_ROLES.includes(req.headers['x-user-role'])) return res.status(403).json({ error: 'Forbidden' });
    const { rows } = await pool.query(
      `UPDATE sos_svc.alerts SET status='RESOLVED', rpf_officer_id=$1, rpf_notes=$2, resolved_at=NOW() WHERE id=$3 RETURNING *`,
      [req.headers['x-user-id'], req.body.notes||'Resolved by RPF officer', req.params.alertId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    const io = req.app.get('io');
    if (io) io.to('rpf-room').emit('sos:resolved', { alertId: req.params.alertId });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/sos/:id/trail ────────────────────────────────────────────────────
router.get('/:alertId/trail', async (req, res, next) => {
  try {
    if (!STAFF_ROLES.includes(req.headers['x-user-role'])) return res.status(403).json({ error: 'Forbidden' });
    const trail = await redis.lRange(`sos:trail:${req.params.alertId}`, 0, -1);
    res.json(trail.map(t => JSON.parse(t)));
  } catch (err) { next(err); }
});

// ── Helper: send SMS with GPS link to emergency contacts ─────────────────────
async function notifyContacts(userId, ref, lat, lng) {
  const { data: contacts } = await axios.get(
    `${USER_SVC_URL}/internal/users/${userId}/emergency-contacts`,
    { headers:{ 'X-Internal-Secret': INTERNAL_SECRET }, timeout:3000 }
  );
  if (!contacts?.length) return;

  const locPart = (lat && lng)
    ? `\nLive Location: https://maps.google.com/?q=${lat},${lng}`
    : '\nLocation: unavailable — please call immediately.';

  for (const c of contacts) {
    const msg = `EMERGENCY: ${c.name}, your contact triggered SOS at Ahmedabad Junction (ADI). Ref: ${ref}.${locPart} RPF alerted. Railway helpline: 182`;
    // STUB: Replace with MSG91 / Gupshup / Twilio
    console.log(`[STUB SMS] To: ${c.phone}\n${msg}\n`);
  }
}

module.exports = router;