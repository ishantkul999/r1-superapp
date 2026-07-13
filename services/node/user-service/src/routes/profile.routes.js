'use strict';
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ── GET /api/users/me ─────────────────────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await pool.query(
      `SELECT user_id, salutation, first_name, last_name, full_name,
              avatar_url, email, gender, preferred_language,
              date_of_birth, marital_status, nationality,
              disability_type, mobility_aid, requires_wheelchair,
              medical_notes, fcm_token, created_at, updated_at
       FROM user_svc.profiles
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      // Profile row doesn't exist yet — return shell
      return res.json({
        userId, salutation: null, firstName: null, lastName: null,
        fullName: null, email: null, dateOfBirth: null,
        maritalStatus: null, nationality: 'Indian', preferredLanguage: 'en',
      });
    }

    const row = rows[0];
    // Normalise snake_case → camelCase for frontend
    res.json({
      userId:            row.user_id,
      salutation:        row.salutation,
      firstName:         row.first_name,
      lastName:          row.last_name,
      fullName:          row.full_name,
      avatarUrl:         row.avatar_url,
      email:             row.email,
      gender:            row.gender,
      preferredLanguage: row.preferred_language,
      dateOfBirth:       row.date_of_birth,
      maritalStatus:     row.marital_status,
      nationality:       row.nationality,
      disabilityType:    row.disability_type,
      mobilityAid:       row.mobility_aid,
      requiresWheelchair:row.requires_wheelchair,
      medicalNotes:      row.medical_notes,
      createdAt:         row.created_at,
      updatedAt:         row.updated_at,
    });
  } catch (err) { next(err); }
});

// ── PUT /api/users/me ─────────────────────────────────────────────────────────
router.put('/me', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      salutation, firstName, lastName, fullName,
      email, gender, preferredLanguage,
      dateOfBirth, maritalStatus, nationality,
      disabilityType, mobilityAid, requiresWheelchair,
      medicalNotes, avatarUrl,
    } = req.body;

    // Derive full_name from first+last if not provided directly
    const derivedFullName = fullName || (firstName && lastName
      ? `${firstName} ${lastName}`.trim()
      : firstName || lastName || null);

    const { rows } = await pool.query(`
      INSERT INTO user_svc.profiles
        (user_id, salutation, first_name, last_name, full_name,
         email, gender, preferred_language,
         date_of_birth, marital_status, nationality,
         disability_type, mobility_aid, requires_wheelchair,
         medical_notes, avatar_url, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        salutation         = COALESCE($2,  user_svc.profiles.salutation),
        first_name         = COALESCE($3,  user_svc.profiles.first_name),
        last_name          = COALESCE($4,  user_svc.profiles.last_name),
        full_name          = COALESCE($5,  user_svc.profiles.full_name),
        email              = COALESCE($6,  user_svc.profiles.email),
        gender             = COALESCE($7,  user_svc.profiles.gender),
        preferred_language = COALESCE($8,  user_svc.profiles.preferred_language),
        date_of_birth      = COALESCE($9,  user_svc.profiles.date_of_birth),
        marital_status     = COALESCE($10, user_svc.profiles.marital_status),
        nationality        = COALESCE($11, user_svc.profiles.nationality),
        disability_type    = COALESCE($12, user_svc.profiles.disability_type),
        mobility_aid       = COALESCE($13, user_svc.profiles.mobility_aid),
        requires_wheelchair= COALESCE($14, user_svc.profiles.requires_wheelchair),
        medical_notes      = COALESCE($15, user_svc.profiles.medical_notes),
        avatar_url         = COALESCE($16, user_svc.profiles.avatar_url),
        updated_at         = NOW()
      RETURNING *
    `, [
      userId, salutation, firstName, lastName, derivedFullName,
      email, gender, preferredLanguage || 'en',
      dateOfBirth || null, maritalStatus || null, nationality || 'Indian',
      disabilityType || null, mobilityAid || null,
      requiresWheelchair != null ? requiresWheelchair : false,
      medicalNotes || null, avatarUrl || null,
    ]);

    res.json(rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /api/users/profile (alias — kept for backward compat) ─────────────────
router.put('/profile', async (req, res, next) => {
  req.url = '/me';
  router.handle(req, res, next);
});

// ── GET /api/users/profile (alias) ────────────────────────────────────────────
router.get('/profile', async (req, res, next) => {
  req.url = '/me';
  router.handle(req, res, next);
});

// ── PUT /api/users/fcm-token ──────────────────────────────────────────────────
router.put('/fcm-token', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { fcmToken } = req.body;
    if (!fcmToken) return res.status(400).json({ error: 'fcmToken required' });
    await pool.query(
      `UPDATE user_svc.profiles SET fcm_token = $1, updated_at = NOW() WHERE user_id = $2`,
      [fcmToken, userId]
    );
    res.json({ message: 'FCM token updated' });
  } catch (err) { next(err); }
});

// ── GET /api/users/:userId (staff lookup — MUST stay last) ────────────────────
router.get('/:userId', async (req, res, next) => {
  try {
    const role = req.headers['x-user-role'];
    if (!['SUPERVISOR','STATION_CONTROL_ROOM','SUPERADMIN','RPF'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM user_svc.profiles WHERE user_id = $1`,
      [req.params.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;