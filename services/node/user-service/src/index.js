require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const app  = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ── Route imports ─────────────────────────────────────────────────────────────
const emergencyRoutes      = require('./routes/emergency.routes');
const profileRoutes        = require('./routes/profile.routes');
const internalRoutes       = require('./routes/internal.routes');
const stationControlRoutes = require('./routes/station-control.routes');
const superAdminRoutes     = require('./routes/superadmin.routes');
const staffProfileRoutes   = require('./routes/staff-profile.routes');  // FIX: was missing

// ── CRITICAL: Mount order matters — specific before wildcard ──────────────────
// /api/users/emergency-contacts must come BEFORE /api/users (which has /:userId wildcard)
app.use('/api/users/emergency-contacts', emergencyRoutes);
app.use('/api/users',                    profileRoutes);

// Internal (server-to-server only — no JWT required, uses X-Internal-Secret)
app.use('/internal', internalRoutes);

// Station Control Room operations
app.use('/api/station/control', stationControlRoutes);

// SuperAdmin operations
app.use('/api/superadmin', superAdminRoutes);

// Staff profile — Porter and RPF read-only profile (FIX: was never mounted)
app.use('/api/staff', staffProfileRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/actuator/health', (req, res) =>
  res.json({ status: 'UP', service: 'user-service' })
);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[user-service] ${req.method} ${req.path} —`, err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`user-service running on :${PORT}`));
module.exports = app;
