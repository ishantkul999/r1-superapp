'use strict';
const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth, requireRole, requireInternal } = require('../middleware/auth');

// GET /api/users/profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.user_id, p.full_name, p.avatar_url, p.email, p.gender,
              p.preferred_language, p.disability_type, p.mobility_aid,
              p.requires_wheelchair, p.medical_notes, p.created_at, p.updated_at
       FROM user_svc.profiles p WHERE p.user_id = $1`,
      [req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile
router.put('/profile', requireAuth, async (req, res) => {
  const {
    fullName, email, gender, preferredLanguage,
    disabilityType, mobilityAid, requiresWheelchair, medicalNotes
  } = req.body;

  try {
    const { rows } = await pool.query(
      `INSERT INTO user_svc.profiles
         (user_id, full_name, email, gender, preferred_language,
          disability_type, mobility_aid, requires_wheelchair, medical_notes, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email,
         gender = EXCLUDED.gender,
         preferred_language = EXCLUDED.preferred_language,
         disability_type = EXCLUDED.disability_type,
         mobility_aid = EXCLUDED.mobility_aid,
         requires_wheelchair = EXCLUDED.requires_wheelchair,
         medical_notes = EXCLUDED.medical_notes,
         updated_at = NOW()
       RETURNING *`,
      [req.userId, fullName, email, gender, preferredLanguage || 'en',
       disabilityType, mobilityAid, requiresWheelchair || false, medicalNotes]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/fcm-token
router.put('/fcm-token', requireAuth, async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) return res.status(400).json({ error: 'fcmToken is required' });

  try {
    await pool.query(
      `UPDATE user_svc.profiles SET fcm_token = $1, updated_at = NOW() WHERE user_id = $2`,
      [fcmToken, req.userId]
    );
    res.json({ message: 'FCM token updated' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/emergency-contacts
router.get('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_svc.emergency_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at`,
      [req.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/emergency-contacts
router.post('/emergency-contacts', requireAuth, async (req, res) => {
  const { name, phone, relation, isPrimary } = req.body;
  if (!name || !phone || !relation) {
    return res.status(400).json({ error: 'name, phone, and relation are required' });
  }

  try {
    // Max 5 contacts check
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM user_svc.emergency_contacts WHERE user_id = $1`,
      [req.userId]
    );
    if (parseInt(countRows[0].count) >= 5) {
      return res.status(400).json({ error: 'Maximum 5 emergency contacts allowed' });
    }

    // If isPrimary, unset existing primary
    if (isPrimary) {
      await pool.query(
        `UPDATE user_svc.emergency_contacts SET is_primary = false WHERE user_id = $1`,
        [req.userId]
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO user_svc.emergency_contacts (user_id, name, phone, relation, is_primary)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.userId, name, phone, relation, isPrimary || false]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /emergency-contacts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/emergency-contacts/:id
router.put('/emergency-contacts/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, phone, relation, isPrimary } = req.body;

  try {
    if (isPrimary) {
      await pool.query(
        `UPDATE user_svc.emergency_contacts SET is_primary = false WHERE user_id = $1`,
        [req.userId]
      );
    }
    const { rows } = await pool.query(
      `UPDATE user_svc.emergency_contacts
       SET name=$1, phone=$2, relation=$3, is_primary=$4, updated_at=NOW()
       WHERE id=$5 AND user_id=$6 RETURNING *`,
      [name, phone, relation, isPrimary || false, id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/emergency-contacts/:id
router.delete('/emergency-contacts/:id', requireAuth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM user_svc.emergency_contacts WHERE id=$1 AND user_id=$2`,
      [req.params.id, req.userId]
    );
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:userId (staff only)
router.get('/:userId', requireAuth, requireRole('SUPERVISOR','STATION_CONTROL_ROOM','SUPERADMIN','RPF'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_svc.profiles WHERE user_id = $1`,
      [req.params.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /internal/users  (called by auth-service after registration)
router.post('/internal/users', requireInternal, async (req, res) => {
  const { userId, phone, role } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_svc.profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [userId]
    );
    res.status(201).json({ message: 'Profile created', userId });
  } catch (err) {
    console.error('Internal user sync error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
