'use strict';
/**
 * superadmin.routes.js — REPLACE existing file
 *
 * FIX: UserManagementPage calls PUT /api/superadmin/users/:id { isActive: bool }
 * Previous version only had /block and /unblock sub-paths.
 * Added PUT /:id to handle the toggle in one call.
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const axios   = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const INTERNAL_SECRET  = process.env.INTERNAL_EVENTS_SECRET || 'dev-internal-secret';

function requireSuperAdmin(req, res) {
  if (req.headers['x-user-role'] !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Forbidden — SuperAdmin role required' });
    return false;
  }
  return true;
}

// ── POST /api/superadmin/stations ─────────────────────────────────────────────
router.post('/stations', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  const createdBy = req.headers['x-user-id'];
  const {
    stationName, stationCode, city, state,
    platformCount, zoneCount,
    stationControl: { name: scrName, phone: scrPhone, email: scrEmail } = {},
  } = req.body;

  if (!stationName || !stationCode || !scrPhone) {
    return res.status(400).json({ error: 'stationName, stationCode, and stationControl.phone are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create SCR auth user via auth-service internal endpoint
    let scrUserId;
    try {
      const { data } = await axios.post(
        `${AUTH_SERVICE_URL}/internal/auth/create-staff`,
        { phone: scrPhone, name: scrName, email: scrEmail, role: 'STATION_CONTROL_ROOM' },
        { headers: { 'X-Internal-Secret': INTERNAL_SECRET }, timeout: 5000 }
      );
      scrUserId = data.userId;
    } catch (authErr) {
      if (authErr.response?.status === 409) {
        const { data } = await axios.get(
          `${AUTH_SERVICE_URL}/internal/auth/user-by-phone?phone=${encodeURIComponent(scrPhone)}`,
          { headers: { 'X-Internal-Secret': INTERNAL_SECRET }, timeout: 5000 }
        );
        scrUserId = data.userId;
      } else throw authErr;
    }

    // Upsert SCR profile
    await client.query(
      `INSERT INTO user_svc.profiles (user_id, full_name, email, updated_at)
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT (user_id) DO UPDATE SET full_name=COALESCE($2,user_svc.profiles.full_name), email=COALESCE($3,user_svc.profiles.email), updated_at=NOW()`,
      [scrUserId, scrName, scrEmail || null]
    );

    // Create station record
    const { rows } = await client.query(
      `INSERT INTO station_svc.stations
         (station_name,station_code,city,state,platform_count,zone_count,
          control_room_user_id,control_room_name,control_room_phone,control_room_email,
          is_active,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE,$11)
       RETURNING *`,
      [stationName, stationCode.toUpperCase(), city || '', state || 'Gujarat',
       parseInt(platformCount) || 0, parseInt(zoneCount) || 0,
       scrUserId, scrName, scrPhone, scrEmail || null, createdBy]
    );

    await client.query(`UPDATE auth_svc.users SET station_id=$1 WHERE id=$2`, [rows[0].id, scrUserId]);
    await client.query('COMMIT');

    res.status(201).json({
      message: `Station ${stationCode.toUpperCase()} created. SCR credentials sent to ${scrPhone}.`,
      station: rows[0], stationControlUserId: scrUserId,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: `Station code ${stationCode} already exists` });
    next(err);
  } finally { client.release(); }
});

// ── GET /api/superadmin/stations ──────────────────────────────────────────────
router.get('/stations', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { rows } = await pool.query(`SELECT * FROM station_svc.stations ORDER BY created_at DESC`);
    res.json({ stations: rows });
  } catch (err) { next(err); }
});

// ── PUT /api/superadmin/stations/:id ─────────────────────────────────────────
router.put('/stations/:id', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  const { stationName, city, state, platformCount, zoneCount, isActive } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE station_svc.stations SET
         station_name=COALESCE($1,station_name), city=COALESCE($2,city), state=COALESCE($3,state),
         platform_count=COALESCE($4,platform_count), zone_count=COALESCE($5,zone_count),
         is_active=COALESCE($6,is_active), updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [stationName, city, state, platformCount, zoneCount, isActive, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Station not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/superadmin/users ─────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  const page = parseInt(req.query.page) || 0;
  const size = parseInt(req.query.size) || 50;
  const roleFilter = req.query.role || 'ALL';
  try {
    const params = [size, page * size];
    const roleWhere = roleFilter !== 'ALL' ? 'AND u.role = $3' : '';
    if (roleFilter !== 'ALL') params.push(roleFilter);
    const { rows } = await pool.query(
      `SELECT u.id, u.phone, u.role, u.is_active AS "isActive", u.created_at AS "createdAt",
              p.full_name AS name, p.email
       FROM auth_svc.users u
       LEFT JOIN user_svc.profiles p ON p.user_id = u.id
       WHERE 1=1 ${roleWhere}
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    // Return plain array — frontend does setUsers(r.data || [])
    res.json(rows);
  } catch (err) { next(err); }
});

// ── PUT /api/superadmin/users/:id  (toggle block/unblock) ─────────────────────
// FIX: UserManagementPage.jsx calls PUT /api/superadmin/users/${id} { isActive: bool }
// Previous version only had /block and /unblock — no /:id route existed.
router.put('/users/:id', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  const { isActive } = req.body;
  if (isActive === undefined) return res.status(400).json({ error: 'isActive is required' });
  try {
    await pool.query(
      `UPDATE auth_svc.users SET is_active=$1 WHERE id=$2`,
      [isActive, req.params.id]
    );
    res.json({ message: isActive ? 'User unblocked' : 'User blocked', isActive });
  } catch (err) { next(err); }
});

// ── Keep explicit block/unblock aliases ───────────────────────────────────────
router.put('/users/:id/block',   async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  try { await pool.query(`UPDATE auth_svc.users SET is_active=FALSE WHERE id=$1`, [req.params.id]); res.json({ message: 'User blocked' }); }
  catch (err) { next(err); }
});
router.put('/users/:id/unblock', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  try { await pool.query(`UPDATE auth_svc.users SET is_active=TRUE WHERE id=$1`, [req.params.id]); res.json({ message: 'User unblocked' }); }
  catch (err) { next(err); }
});

// ── GET /api/superadmin/platform-overview ─────────────────────────────────────
router.get('/platform-overview', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM auth_svc.users WHERE is_active=TRUE)                          AS "totalUsers",
        (SELECT COUNT(*) FROM auth_svc.users WHERE role='PORTER' AND is_active=TRUE)        AS "totalPorters",
        (SELECT COUNT(*) FROM porter_svc.porter_bookings)                                   AS "totalBookings",
        (SELECT COALESCE(SUM(total_amount),0) FROM porter_svc.porter_bookings WHERE status='COMPLETED') AS "totalRevenue",
        (SELECT COUNT(*) FROM sos_svc.alerts)                                               AS "totalSos",
        (SELECT COUNT(*) FROM station_svc.stations WHERE is_active=TRUE)                    AS "totalStations"
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── GET /api/superadmin/audit ─────────────────────────────────────────────────
router.get('/audit', async (req, res, next) => {
  if (!requireSuperAdmin(req, res)) return;
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

module.exports = router;
