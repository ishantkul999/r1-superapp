import { useEffect, useRef } from 'react';
import useAuthStore from '../stores/authStore.js';

const SOS_SOCKET_URL = import.meta.env.VITE_SOS_SOCKET_URL || 'http://localhost:3006';

let socketIoModule = null;

async function getSocketIo() {
  if (!socketIoModule) {
    try {
      const mod = await import('socket.io-client');
      socketIoModule = mod.io || mod.default;
    } catch {
      console.warn('[Realtime] socket.io-client not installed. Run: npm install socket.io-client');
      return null;
    }
  }
  return socketIoModule;
}

/**
 * useRealtimeBookings
 *
 * DROP AT: src/hooks/useRealtimeBookings.js
 *
 * Connects to sos-service Socket.io (port 3006) and joins the correct room
 * based on the current user's role. Emits the join event that socket.handlers.js
 * now handles.
 *
 * Usage:
 *   // In SupervisorDashboard.jsx or UnassignedQueuePage.jsx:
 *   useRealtimeBookings({
 *     onNewBooking:  (event) => setQueue(q => [event, ...q]),
 *     onEscalated:  (event) => flash('warning', `${event.bookingReference} needs manual assignment`),
 *     onAssigned:   (event) => setQueue(q => q.filter(b => b.id !== event.bookingId)),
 *   });
 *
 *   // In PorterDashboard.jsx:
 *   useRealtimeBookings({
 *     porterId: dashboard?.porterId,
 *     onJobAssigned: () => refresh(),
 *   });
 *
 *   // In UserDashboard.jsx / BookingsPage.jsx:
 *   useRealtimeBookings({
 *     onBookingStatus:    (b) => setStatus(b.statusMessage),
 *     onBookingAssigned:  (b) => setStatus('Porter assigned — on the way!'),
 *     onBookingCompleted: () => setStatus('Service completed'),
 *   });
 */
export default function useRealtimeBookings({
  onNewBooking,
  onEscalated,
  onAssigned,
  onJobAssigned,
  onBookingStatus,
  onBookingAssigned,
  onBookingCompleted,
  porterId,
} = {}) {
  const { user, role } = useAuthStore();
  const socketRef = useRef(null);

  useEffect(() => {
    let socket = null;
    let active = true;

    (async () => {
      const io = await getSocketIo();
      if (!io || !active) return;

      socket = io(SOS_SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 8,
        reconnectionDelay: 3000,
        timeout: 10000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        // Emit the correct join event based on role
        // socket.handlers.js now handles all three of these
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
        console.log(`[Realtime] Joined room: ${room}`);
      });

      // Supervisor events
      if (onNewBooking)  socket.on('booking:new',              onNewBooking);
      if (onEscalated)   socket.on('booking:escalated',        onEscalated);
      if (onAssigned)    socket.on('booking:removed-from-queue', onAssigned);

      // Porter events
      if (onJobAssigned) socket.on('job:assigned',             onJobAssigned);

      // User/passenger events
      if (onBookingStatus)    socket.on('booking:status',    onBookingStatus);
      if (onBookingAssigned)  socket.on('booking:assigned',  onBookingAssigned);
      if (onBookingCompleted) socket.on('booking:completed', onBookingCompleted);

      socket.on('connect_error', (err) => {
        console.warn('[Realtime] Connection error:', err.message);
      });
    })();

    return () => {
      active = false;
      if (socket) { socket.disconnect(); }
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user?.id, porterId]);

  return socketRef;
}
