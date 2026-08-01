'use strict';

const { Kafka } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
  clientId: 'sos-service-bridge',
  brokers:  KAFKA_BROKERS,
  retry: {
    initialRetryTime: 1000,
    retries: 8,
  },
});

const TOPICS = [
  'porter.booked',
  'porter.assigned',
  'porter.completed',
  'supervisor.escalation',
];

async function startPorterEventsConsumer(io) {
  const consumer = kafka.consumer({
    groupId: 'sos-service-socket-bridge',
    sessionTimeout:      60000,   
    heartbeatInterval:   20000,  
    maxBytesPerPartition: 1048576, 
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

    console.log('[Kafka Bridge] Connected. Subscribed to:', TOPICS.join(', '));

    await consumer.run({
      partitionsConsumedConcurrently: 1,
      eachMessage: async ({ topic, message }) => {
        let event;
        try {
          event = JSON.parse(message.value.toString());
        } catch (e) {
          console.error('[Kafka Bridge] Bad message on', topic, ':', e.message);
          return;
        }

        try {
          switch (topic) {
            case 'porter.booked':
              io.to('supervisor-room').emit('booking:new', event);
              if (event.userId) {
                io.to(`user:${event.userId}`).emit('booking:status', {
                  ...event,
                  statusMessage: 'Finding a porter for you…',
                });
              }
              console.log(`[Kafka Bridge] booking:new → supervisor-room + user:${event.userId}`);
              break;

            case 'porter.assigned':
              if (event.userId) {
                io.to(`user:${event.userId}`).emit('booking:assigned', {
                  ...event,
                  statusMessage: 'A porter has been assigned and is on the way!',
                });
              }
              io.to('supervisor-room').emit('booking:removed-from-queue', { bookingId: event.bookingId });
              if (event.porterId) {
                io.to(`porter:${event.porterId}`).emit('job:assigned', event);
              }
              console.log(`[Kafka Bridge] booking:assigned → user:${event.userId}, porter:${event.porterId}`);
              break;

            case 'porter.completed':
              if (event.userId) {
                io.to(`user:${event.userId}`).emit('booking:completed', event);
              }
              break;

            case 'supervisor.escalation':
              io.to('supervisor-room').emit('booking:escalated', {
                ...event,
                statusMessage: 'No porter accepted within 15 seconds. Manual assignment needed.',
              });
              console.log(`[Kafka Bridge] booking:escalated → supervisor-room (${event.bookingId})`);
              break;
          }
        } catch (emitErr) {
          console.error('[Kafka Bridge] Socket emit error on topic', topic, ':', emitErr.message);
        }
      },
    });

  } catch (err) {
    console.error('[Kafka Bridge] Consumer start failed:', err.message);
    console.error('[Kafka Bridge] Retrying in 30 seconds…');
    setTimeout(() => startPorterEventsConsumer(io), 30000);
  }

  // Handle graceful shutdown
  const shutdown = async () => {
    try { await consumer.disconnect(); } catch { /* ignore */ }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

module.exports = { startPorterEventsConsumer };