import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore.js';

const SOS_SOCKET_URL = import.meta.env.VITE_SOS_SOCKET_URL || 'http://localhost:3006';

// Lazy-load socket.io-client to avoid breaking pages if it's not installed
let cachedIo = null;
async function getIo() {
  if (cachedIo) return cachedIo;
  try {
    const mod = await import('socket.io-client');
    cachedIo = mod.io || mod.default;
    return cachedIo;
  } catch (e) {
    console.warn('[Realtime] socket.io-client not found. Run: npm install socket.io-client');
    return null;
  }
}

export default function useRealtimeBookings({
  porterId,
  onNewBooking,
  onEscalated,
  onAssigned,
  onJobAssigned,
  onBookingStatus,
  onBookingAssigned,
  onBookingCompleted,
  onNotification,
} = {}) {
  const { user, role } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let mounted = true;

    (async () => {
      const io = await getIo();
      if (!io || !mounted) return;

      socket = io(SOS_SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        timeout: 10000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        // Join the correct room based on role
        if (['SUPERVISOR', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
          socket.emit('join:supervisor', { userId: user?.id, role });
        }
        if (role === 'PORTER' && porterId) {
          socket.emit('join:porter', { porterId });
        }
        if (role === 'USER' && user?.id) {
          socket.emit('join:user', { userId: user.id });
        }
      });

      socket.on('joined', ({ room }) => {
        console.log('[Realtime] Joined room:', room);
      });

      // ── Supervisor events ───────────────────────────────────────────────────
      // Fired when a new booking is created (porter.booked Kafka → Kafka bridge)
      if (onNewBooking)  socket.on('booking:new',                onNewBooking);

      // Fired when 15s timer expires with no porter acceptance
      if (onEscalated)   socket.on('booking:escalated',          onEscalated);

      // Fired when porter accepts (removed from unassigned queue)
      if (onAssigned)    socket.on('booking:removed-from-queue', onAssigned);

      // ── Porter events ───────────────────────────────────────────────────────
      // Fired when supervisor manually assigns a job to this porter
      if (onJobAssigned) socket.on('job:assigned',               onJobAssigned);

      // ── User / passenger events ─────────────────────────────────────────────
      if (onBookingStatus)    socket.on('booking:status',    onBookingStatus);
      if (onBookingAssigned)  socket.on('booking:assigned',  onBookingAssigned);
      if (onBookingCompleted) socket.on('booking:completed', onBookingCompleted);

      // Pushed by sos-service's notification-events Kafka bridge the
      // instant notification-service persists a new notification for this
      // user — this is what lets the bell update without waiting for the
      // next poll.
      if (onNotification) socket.on('notification:new', onNotification);

      socket.on('connect_error', err => {
        console.warn('[Realtime] Connection error:', err.message);
      });

      socket.on('disconnect', reason => {
        console.log('[Realtime] Disconnected:', reason);
      });
    })();

    return () => {
      mounted = false;
      if (socket) socket.disconnect();
      socketRef.current = null;
    };
  // Re-run only when role/userId/porterId changes — NOT on callback changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.id, porterId]);

  return socketRef;
}
