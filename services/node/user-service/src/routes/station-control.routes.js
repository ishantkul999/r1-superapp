'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const axios   = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL   || 'http://localhost:8081';
const INTERNAL_SECRET  = process.env.INTERNAL_EVENTS_SECRET || 'dev-internal-secret';
const SCR_ROLES = ['STATION_CONTROL_ROOM', 'SUPERADMIN'];

function requireScr(req, res) {
  if (!SCR_ROLES.includes(req.headers['x-user-role'])) {
    res.status(403).json({ error: 'Forbidden — Station Control Room role required' });
    return false;
  }
  return true;
}

async function getStationId(callerId) {
  const { rows } = await pool.query(
    `SELECT station_id FROM auth_svc.users WHERE id = $1`, [callerId]
  );
  return rows[0]?.station_id || '00000000-0000-0000-0000-100000000001';
}

// ── POST /api/station/control/staff/onboard ───────────────────────────────────
router.post('/staff/onboard', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  const callerId = req.headers['x-user-id'];
  const { phone, name, email, role, badgeNumber, employeeId, zone } = req.body;

  if (!phone || !name || !role) {
    return res.status(400).json({ error: 'phone, name, and role are required' });
  }
  if (!['SUPERVISOR', 'RPF'].includes(role)) {
    return res.status(400).json({ error: 'role must be SUPERVISOR or RPF' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Step 1: Get or create auth user ──────────────────────────────────────
    let authUserId;
    try {
      const { data } = await axios.post(
        `${AUTH_SERVICE_URL}/internal/auth/create-staff`,
        { phone, name, email: email || '', role },
        { headers: { 'X-Internal-Secret': INTERNAL_SECRET }, timeout: 5000 }
      );
      authUserId = data.userId;
    } catch (authErr) {
      if (authErr.response?.status === 409) {
        // User already exists — look them up
        const { data } = await axios.get(
          `${AUTH_SERVICE_URL}/internal/auth/user-by-phone?phone=${encodeURIComponent(phone)}`,
          { headers: { 'X-Internal-Secret': INTERNAL_SECRET }, timeout: 5000 }
        );
        authUserId = data.userId;
        // Update role if different
        await axios.put(
          `${AUTH_SERVICE_URL}/api/auth/role`,
          { userId: authUserId, role },
          { headers: { 'X-Internal-Secret': INTERNAL_SECRET, 'X-User-Role': 'SUPERADMIN' } }
        ).catch(() => {});
      } else {
        // Extract a clean string error message
        const msg = authErr.response?.data?.error
          || authErr.response?.data?.message
          || authErr.message
          || 'Auth service error';
        return res.status(authErr.response?.status || 500).json({ error: String(msg) });
      }
    }

    // ── Step 2: Upsert user profile ───────────────────────────────────────────
    await client.query(
      `INSERT INTO user_svc.profiles (user_id, full_name, email, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
         SET full_name  = COALESCE($2, user_svc.profiles.full_name),
             email      = COALESCE($3, user_svc.profiles.email),
             updated_at = NOW()`,
      [authUserId, name, email || null]
    );

    // ── Step 3: Get station ID ────────────────────────────────────────────────
    const stationId = await getStationId(callerId);


    try {
      await client.query(
        `INSERT INTO station_svc.staff_onboarding
           (user_id, station_id, role, badge_number, employee_id, zone, onboarded_by, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)`,
        [authUserId, stationId, role, badgeNumber || null, employeeId || null,
         zone || null, callerId]
      );
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        await client.query(
          `UPDATE station_svc.staff_onboarding
           SET role         = $1,
               badge_number = COALESCE($2, badge_number),
               employee_id  = COALESCE($3, employee_id),
               zone         = COALESCE($4, zone),
               updated_at   = NOW()
           WHERE user_id = $5`,
          [role, badgeNumber || null, employeeId || null, zone || null, authUserId]
        );
      } else {
        throw insertErr;
      }
    }

    // ── Step 5: Update user's station_id ─────────────────────────────────────
    await client.query(
      `UPDATE auth_svc.users SET station_id = $1 WHERE id = $2`,
      [stationId, authUserId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: `${role === 'SUPERVISOR' ? 'Supervisor' : 'RPF Officer'} "${name}" created successfully. Login OTP sent to ${phone}.`,
      userId: authUserId, role, phone, name, stationId,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[user-service] POST /api/station/control/staff/onboard —', err.message);
    next({ status: 500, message: err.message || 'Staff onboarding failed' });
  } finally {
    client.release();
  }
});

// ── GET /api/station/control/staff ────────────────────────────────────────────
router.get('/staff', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    const stationId = await getStationId(req.headers['x-user-id']);
    const { rows } = await pool.query(`
      SELECT u.id, u.phone, u.role, u.is_active,
             p.full_name AS name, p.email,
             s.badge_number, s.employee_id, s.zone, s.created_at AS onboarded_at
      FROM station_svc.staff_onboarding s
      JOIN auth_svc.users u ON u.id = s.user_id
      LEFT JOIN user_svc.profiles p ON p.user_id = s.user_id
      WHERE s.station_id = $1
      ORDER BY s.created_at DESC
    `, [stationId]);
    res.json({ staff: rows });
  } catch (err) { next(err); }
});

// ── PUT /api/station/control/staff/:id (edit) ────────────────────────────────
router.put('/staff/:id', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  const { badgeNumber, employeeId, zone, email } = req.body;
  try {
    await pool.query(
      `UPDATE station_svc.staff_onboarding
       SET badge_number = COALESCE($1, badge_number),
           employee_id  = COALESCE($2, employee_id),
           zone         = COALESCE($3, zone),
           updated_at   = NOW()
       WHERE user_id = $4`,
      [badgeNumber || null, employeeId || null, zone || null, req.params.id]
    );
    if (email) {
      await pool.query(
        `UPDATE user_svc.profiles SET email = COALESCE($1, email), updated_at = NOW()
         WHERE user_id = $2`,
        [email, req.params.id]
      );
    }
    res.json({ message: 'Staff member updated' });
  } catch (err) { next(err); }
});

// ── PUT /api/station/control/staff/:id/disable ────────────────────────────────
router.put('/staff/:id/disable', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    await pool.query(`UPDATE auth_svc.users SET is_active = FALSE WHERE id = $1`, [req.params.id]);
    await pool.query(`UPDATE station_svc.staff_onboarding SET is_active = FALSE, updated_at = NOW() WHERE user_id = $1`, [req.params.id]);
    res.json({ message: 'Staff member disabled' });
  } catch (err) { next(err); }
});

// ── PUT /api/station/control/staff/:id/enable ─────────────────────────────────
router.put('/staff/:id/enable', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    await pool.query(`UPDATE auth_svc.users SET is_active = TRUE WHERE id = $1`, [req.params.id]);
    await pool.query(`UPDATE station_svc.staff_onboarding SET is_active = TRUE, updated_at = NOW() WHERE user_id = $1`, [req.params.id]);
    res.json({ message: 'Staff member enabled' });
  } catch (err) { next(err); }
});

// ── GET /api/station/control/dashboard ───────────────────────────────────────
router.get('/dashboard', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM porter_svc.porters WHERE is_online = TRUE AND is_active = TRUE)           AS "onlinePorters",
        (SELECT COUNT(*) FROM porter_svc.porter_bookings WHERE status = 'PENDING_ACCEPTANCE')           AS "pendingBookings",
        (SELECT COUNT(*) FROM porter_svc.porter_bookings WHERE status IN ('ACCEPTED','IN_PROGRESS'))    AS "activeBookings",
        (SELECT COUNT(*) FROM sos_svc.alerts WHERE status = 'ACTIVE')                                   AS "activeSos",
        (SELECT COUNT(*) FROM station_svc.locker_bookings WHERE status = 'ACTIVE')                     AS "activeLockers",
        (SELECT COUNT(*) FROM station_svc.station_room_bookings WHERE status IN ('CONFIRMED','CHECKED_IN')) AS "activeRooms"
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/station/control/bookings ────────────────────────────────────────
router.get('/bookings', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.booking_reference, b.service_type, b.status,
             b.passenger_name, b.passenger_mobile, b.pnr_number,
             b.platform, b.coach_number, b.total_amount, b.payment_method, b.created_at,
             p.badge_number AS porter_badge
      FROM porter_svc.porter_bookings b
      LEFT JOIN porter_svc.porters p ON p.id = b.porter_id
      ORDER BY b.created_at DESC LIMIT 200
    `);
    res.json({ bookings: rows });
  } catch (err) { next(err); }
});

// ── GET /api/station/control/audit ────────────────────────────────────────────
router.get('/audit', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 50;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM station_svc.audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [size, page * size]
    );
    res.json({ logs: rows });
  } catch (err) { next(err); }
});

// ── GET /api/station/control/analytics ───────────────────────────────────────
router.get('/analytics', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', b.created_at AT TIME ZONE 'Asia/Kolkata'), 'Mon YYYY') AS month,
        COUNT(*) AS total_bookings,
        SUM(b.total_amount) AS revenue,
        COUNT(*) FILTER (WHERE b.status = 'COMPLETED') AS completed,
        COUNT(*) FILTER (WHERE b.status = 'CANCELLED') AS cancelled
      FROM porter_svc.porter_bookings b
      WHERE b.created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', b.created_at AT TIME ZONE 'Asia/Kolkata')
      ORDER BY DATE_TRUNC('month', b.created_at AT TIME ZONE 'Asia/Kolkata')
    `);
    res.json({ analytics: rows });
  } catch (err) { next(err); }
});

// ── POST /api/station/control/broadcast ──────────────────────────────────────
router.post('/broadcast', async (req, res, next) => {
  if (!requireScr(req, res)) return;
  const senderId = req.headers['x-user-id'];
  const { title, body, type, targetRole, channel } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  try {
    const stationId = await getStationId(senderId);

    await pool.query(
      `INSERT INTO station_svc.audit_logs (service, actor_id, action, resource, outcome, created_at)
       VALUES ('station-control', $1, 'BROADCAST_SENT', $2, 'SUCCESS', NOW())`,
      [senderId, `${type || 'ANNOUNCEMENT'}:${targetRole || 'ALL'}`]
    ).catch(() => {}); // non-fatal if audit_logs not set up

    console.log(`[BROADCAST] Station ${stationId} | Type: ${type} | To: ${targetRole} | Channel: ${channel} | "${title}"`);

    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8093'}/api/notifications/internal/broadcast`,
        { title, body, type, targetRole, stationId, channel },
        { headers: { 'X-Internal-Secret': INTERNAL_SECRET }, timeout: 3000 }
      );
    } catch { /* non-fatal */ }

    res.json({ message: 'Broadcast sent successfully', type, targetRole, channel });
  } catch (err) { next(err); }
});

router.use((err, req, res, next) => {
  const msg = typeof err.message === 'string' ? err.message : 'Internal server error';
  res.status(err.status || 500).json({ error: msg });
});

module.exports = router;
