const express = require('express');
const router  = express.Router();
const pool    = require('../db');

const INTERNAL_SECRET = process.env.INTERNAL_EVENTS_SECRET || 'dev-internal-secret';

const requireInternalSecret = (req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized internal request' });
  }
  next();
};

// POST /internal/users — called by auth-service on new user registration
router.post('/users', requireInternalSecret, async (req, res, next) => {
  try {
    const { userId, phone, role } = req.body;
    if (!userId || !phone) return res.status(400).json({ error: 'userId and phone required' });

    await pool.query(
      `INSERT INTO user_svc.profiles (user_id, updated_at)
       VALUES ($1, NOW())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId]
    );

    console.log(`Profile created for user ${userId} (${role})`);
    res.status(201).json({ message: 'Profile created', userId });
  } catch (err) { next(err); }
});

router.post('/users/batch', requireInternalSecret, async (req, res, next) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.json([]);
    }

    // Build $1,$2,... placeholders
    const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `SELECT u.id          AS "userId",
              p.full_name   AS name,
              u.phone
       FROM auth_svc.users u
       LEFT JOIN user_svc.profiles p ON p.user_id = u.id
       WHERE u.id::text IN (${placeholders})`,
      userIds
    );

    res.json(rows);
  } catch (err) { next(err); }
});

// GET /internal/users/:userId/fcm-token — used by notification-service
router.get('/users/:userId/fcm-token', requireInternalSecret, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT fcm_token FROM user_svc.profiles WHERE user_id = $1',
      [req.params.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Profile not found' });
    res.json({ fcmToken: rows[0].fcm_token });
  } catch (err) { next(err); }
});

// GET /internal/users/:userId/emergency-contacts — used by SOS service
router.get('/users/:userId/emergency-contacts', requireInternalSecret, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_svc.emergency_contacts
       WHERE user_id = $1 ORDER BY is_primary DESC`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
