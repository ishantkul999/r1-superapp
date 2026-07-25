const { Kafka } = require('kafkajs');

// ─────────────────────────────────────────────────────────────────────────────
// notification-events.consumer.js
//
// Bridges notification-service's "notification.created" Kafka topic to a
// live Socket.io push, so NotificationDropdown.jsx updates the moment a
// notification is created instead of waiting up to 8s for the next poll.
//
// This is a SEPARATE consumer group from porter-events.consumer.js
// (different topic, different concern) so the two can be deployed/scaled/
// restarted independently and a slow consumer in one doesn't back up the
// other's partition assignment.
//
// The frontend joins "user:{userId}" via socket.handlers.js's existing
// `join:user` handler (already wired for booking-status pushes) — this
// reuses that same room rather than introducing a new join event.
// ─────────────────────────────────────────────────────────────────────────────

const kafka = new Kafka({
  clientId: 'sos-service-notification-bridge',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

async function startNotificationEventsConsumer(io) {
  const consumer = kafka.consumer({ groupId: 'sos-service-notification-bridge' });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'notification.created', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const notification = JSON.parse(message.value.toString());
          const { userId } = notification;

          if (!userId) {
            console.warn('[Notification Bridge] Event missing userId, skipping:', notification);
            return;
          }

          io.to(`user:${userId}`).emit('notification:new', notification);
          console.log(`[Notification Bridge] notification:new -> user:${userId} (${notification.title})`);
        } catch (err) {
          // Never let a malformed message crash the consumer loop — log
          // and move on, same principle as the porter-events consumer.
          console.error('[Notification Bridge] Failed to process message:', err.message);
        }
      },
    });

    console.log('[Notification Bridge] Connected. Subscribed to: notification.created');
  } catch (err) {
    console.error('[Notification Bridge] Failed to start consumer:', err.message);
    // Don't crash the whole service if Kafka isn't reachable yet — retry
    // after a delay, since this bridge is a live-push enhancement, not a
    // hard dependency (polling in NotificationDropdown.jsx still works as
    // a fallback if this never connects).
    setTimeout(() => startNotificationEventsConsumer(io), 10000);
  }
}

module.exports = { startNotificationEventsConsumer };