const express = require('express');
const router = express.Router();
const pool = require('../db');

const MAX_CONTACTS = 5;

// GET /api/users/emergency-contacts
router.get('/', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { rows } = await pool.query(
      `SELECT * FROM user_svc.emergency_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC`,
      [userId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/users/emergency-contacts
router.post('/', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.headers['x-user-id'];
    const { name, phone, relation, isPrimary } = req.body;

    if (!name || !phone || !relation) {
      return res.status(400).json({ error: 'name, phone, relation are required' });
    }

    await client.query('BEGIN');

    // Check limit
    const { rows: existing } = await client.query(
      'SELECT COUNT(*) FROM user_svc.emergency_contacts WHERE user_id = $1',
      [userId]
    );
    if (parseInt(existing[0].count) >= MAX_CONTACTS) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Maximum ${MAX_CONTACTS} emergency contacts allowed` });
    }

    // If setting as primary, unset existing primary
    if (isPrimary) {
      await client.query(
        'UPDATE user_svc.emergency_contacts SET is_primary = false WHERE user_id = $1',
        [userId]
      );
    }

    const { rows } = await client.query(
      `INSERT INTO user_svc.emergency_contacts (user_id, name, phone, relation, is_primary)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, name, phone, relation, isPrimary || false]
    );

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/users/emergency-contacts/:id
router.put('/:id', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const userId = req.headers['x-user-id'];
    const { id } = req.params;
    const { name, phone, relation, isPrimary } = req.body;

    await client.query('BEGIN');

    // Verify ownership
    const { rows: check } = await client.query(
      'SELECT * FROM user_svc.emergency_contacts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (check.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (isPrimary) {
      await client.query(
        'UPDATE user_svc.emergency_contacts SET is_primary = false WHERE user_id = $1',
        [userId]
      );
    }

    const { rows } = await client.query(
      `UPDATE user_svc.emergency_contacts
       SET name = COALESCE($1, name), phone = COALESCE($2, phone),
           relation = COALESCE($3, relation), is_primary = COALESCE($4, is_primary),
           updated_at = NOW()
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, phone, relation, isPrimary, id, userId]
    );

    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/users/emergency-contacts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { rowCount } = await pool.query(
      'DELETE FROM user_svc.emergency_contacts WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
