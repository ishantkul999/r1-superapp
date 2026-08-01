const { Kafka } = require('kafkajs');

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
          console.error('[Notification Bridge] Failed to process message:', err.message);
        }
      },
    });

    console.log('[Notification Bridge] Connected. Subscribed to: notification.created');
  } catch (err) {
    console.error('[Notification Bridge] Failed to start consumer:', err.message);
    setTimeout(() => startNotificationEventsConsumer(io), 10000);
  }
}

module.exports = { startNotificationEventsConsumer };