'use strict';
/**
 * staff-profile.routes.js — read-only profile for onboarded staff (Porter, RPF)
 *
 * DROP AT:
 *   services/node/user-service/src/routes/staff-profile.routes.js
 *
 * Mount in index.js:
 *   app.use('/api/staff', require('./routes/staff-profile.routes'));
 *
 * These endpoints serve the "Profile" page for Porter and RPF roles.
 * The profile data is a combination of:
 *   - auth_svc.users (phone, role, name)
 *   - user_svc.profiles (contact details)
 *   - station_svc.staff_onboarding (badge, zone, employee_id, assigned by SCR)
 *   - porter_svc.porters (badge, service_type for porter role)
 *
 * The profile is READ-ONLY for the staff member — it reflects what the
 * Station Control Room entered at onboarding. Only SCR can edit it.
 */
const express = require('express');
const router  = express.Router();
const pool    = require('../db');

const STAFF_ROLES = ['PORTER', 'RPF', 'SUPERVISOR'];

// ── GET /api/staff/profile/me ─────────────────────────────────────────────────
// Returns the complete onboarded profile for the logged-in staff member.
router.get('/profile/me', async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const role   = req.headers['x-user-role'];

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!STAFF_ROLES.includes(role)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Get base user + profile
    const { rows: userRows } = await pool.query(`
      SELECT
        u.id, u.phone, u.role, u.is_active, u.station_id, u.created_at,
        p.full_name, p.first_name, p.last_name, p.email,
        p.salutation, p.date_of_birth, p.gender
      FROM auth_svc.users u
      LEFT JOIN user_svc.profiles p ON p.user_id = u.id
      WHERE u.id = $1
    `, [userId]);

    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    const user = userRows[0];

    // Get onboarding details from station_svc
    const { rows: onboardRows } = await pool.query(`
      SELECT
        s.badge_number, s.employee_id, s.zone, s.onboarded_by,
        s.created_at AS onboarded_at,
        st.station_name, st.station_code, st.city
      FROM station_svc.staff_onboarding s
      LEFT JOIN station_svc.stations st ON st.id = s.station_id
      WHERE s.user_id = $1
    `, [userId]);

    // For porter role, also get porter-specific details
    let porterDetails = null;
    if (role === 'PORTER') {
      const { rows: porterRows } = await pool.query(`
        SELECT
          id AS porter_id, badge_number, license_id, service_type,
          zone, platforms, is_online, is_active,
          avg_rating, total_services, employee_id, full_name
        FROM porter_svc.porters
        WHERE user_id = $1
      `, [userId]);
      if (porterRows.length) porterDetails = porterRows[0];
    }

    res.json({
      // Identity
      userId:      user.id,
      phone:       user.phone,
      role:        user.role,
      isActive:    user.is_active,
      // Personal details
      salutation:  user.salutation,
      firstName:   user.first_name,
      lastName:    user.last_name,
      fullName:    user.full_name,
      email:       user.email,
      dateOfBirth: user.date_of_birth,
      gender:      user.gender,
      // Onboarding details (read-only — set by Station Control Room)
      onboarding:  onboardRows[0] || null,
      // Porter-specific (null for RPF/Supervisor)
      porterProfile: porterDetails,
      // Note: profile is managed by Station Control Room
      isReadOnly:  true,
      editNote:    'Contact your Station Control Room to update profile details.',
    });

  } catch (err) { next(err); }
});

module.exports = router;
