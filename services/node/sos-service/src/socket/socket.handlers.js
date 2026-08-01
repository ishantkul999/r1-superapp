'use strict';

module.exports = { setupSocketHandlers };

function setupSocketHandlers(io) {

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join:rpf', ({ userId, role } = {}) => {
      if (!userId) return;
      if (['RPF', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
        socket.join('rpf-room');
        console.log(`[Socket] ${socket.id} joined rpf-room (userId=${userId}, role=${role})`);
      }
    });

    socket.on('join:supervisor', ({ userId, role } = {}) => {
      if (!userId) return;
      if (['SUPERVISOR', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
        socket.join('supervisor-room');
        console.log(`[Socket] ${socket.id} joined supervisor-room (userId=${userId}, role=${role})`);
        socket.emit('joined', { room: 'supervisor-room' });
      }
    });

    socket.on('join:porter', ({ porterId } = {}) => {
      if (!porterId) return;
      const room = `porter:${porterId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
      socket.emit('joined', { room });
    });

    socket.on('join:user', ({ userId } = {}) => {
      if (!userId) return;
      const room = `user:${userId}`;
      socket.join(room);
      console.log(`[Socket] ${socket.id} joined ${room}`);
      socket.emit('joined', { room });
    });

    socket.on('sos:location', ({ alertId, lat, lng } = {}) => {
      if (!alertId) return;
      io.to('rpf-room').emit('sos:location_update', { alertId, lat, lng, ts: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket] Error on ${socket.id}:`, err.message);
    });
  });
}
