'use strict';
/**
 * socket.handlers.js — REPLACE existing file
 *
 * DROP AT:
 *   services/node/sos-service/src/socket/socket.handlers.js
 *
 * CHANGES FROM ORIGINAL:
 *   + Added join:supervisor handler → joins 'supervisor-room'
 *   + Added join:porter handler    → joins 'porter:{porterId}'
 *   + Added join:user handler      → joins 'user:{userId}'
 *
 *   These are required by useRealtimeBookings.js (the new React hook).
 *   Without these handlers, the hook emits the join events but the server
 *   ignores them — so the WebSocket connects but rooms are never joined,
 *   meaning booking events are never received by the frontend.
 *
 *   Original RPF/SOS handlers (join:rpf, sos:resolved, etc.) are UNCHANGED.
 */
module.exports = { setupSocketHandlers };

function setupSocketHandlers(io) {

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── ORIGINAL: RPF joins the RPF room for SOS alerts ────────────────────
    socket.on('join:rpf', ({ userId, role } = {}) => {
      if (!userId) return;
      if (['RPF', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
        socket.join('rpf-room');
        console.log(`[Socket] ${socket.id} joined rpf-room (userId=${userId}, role=${role})`);
      }
    });

    // ── NEW: Supervisor joins supervisor-room for booking events ─────────────
    // Called by useRealtimeBookings when role is SUPERVISOR/STATION_CONTROL_ROOM/SUPERADMIN
    socket.on('join:supervisor', ({ userId, role } = {}) => {
      if (!userId) return;
      if (['SUPERVISOR', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
        socket.join('supervisor-room');
        console.log(`[Socket] ${socket.id} joined supervisor-room (userId=${userId}, role=${role})`);
        socket.emit('joined', { room: 'supervisor-room' });
      }
    });

    // ── NEW: Porter joins their personal room for job assignments ────────────
    // Called by useRealtimeBookings when role is PORTER
    socket.on('join:porter', ({ porterId } = {}) => {
      if (!porterId) return;
      const room = `porter:${porterId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
      socket.emit('joined', { room });
    });

    // ── NEW: User (passenger) joins their personal room for booking status ───
    // Called by useRealtimeBookings when role is USER
    socket.on('join:user', ({ userId } = {}) => {
      if (!userId) return;
      const room = `user:${userId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
      socket.emit('joined', { room });
    });

    // ── ORIGINAL: SOS location update ────────────────────────────────────────
    socket.on('sos:location', ({ alertId, lat, lng } = {}) => {
      if (!alertId) return;
      io.to('rpf-room').emit('sos:location_update', { alertId, lat, lng, ts: Date.now() });
    });

    // ── ORIGINAL: Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error on ${socket.id}:`, err.message);
    });
  });
}
