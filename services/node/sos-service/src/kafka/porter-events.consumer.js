'use strict';
/**
 * porter-events.consumer.js — REPLACE existing file
 *
 * DROP AT:
 *   services/node/sos-service/src/kafka/porter-events.consumer.js
 *
 * FIX: Kafka consumer rebalance storm
 * Image 2 showed repeated errors from 'sos-service-bridge' consumer group:
 *   "The coordinator is not aware of this member"
 *   "re-joining the group"
 *
 * ROOT CAUSE: KafkaJS default sessionTimeout is 30s. When the sos-service
 * Kafka consumer takes longer than 30s to process + heartbeat (e.g. during
 * a Socket.io broadcast to many clients), the broker considers it dead and
 * removes it from the group → rebalance → consumer re-joins → same loop.
 *
 * FIX: Increase sessionTimeout + heartbeatInterval in the consumer config.
 * Also added retry config so transient connection errors don't crash the consumer.
 */
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
    // FIX: increased timeouts to stop rebalance storm
    sessionTimeout:      60000,   // 60s — broker waits this long before declaring consumer dead
    heartbeatInterval:   20000,   // 20s — consumer sends heartbeat every 20s (must be < 1/3 of sessionTimeout)
    maxBytesPerPartition: 1048576, // 1MB per partition per fetch
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

    console.log('[Kafka Bridge] Connected. Subscribed to:', TOPICS.join(', '));

    await consumer.run({
      // Process one message at a time — prevents long processing blocking heartbeats
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
              // New booking: notify supervisor-room instantly + user
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
              // Porter accepted: notify user + remove from supervisor queue
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
              // 15s timer expired — push to supervisor for manual assignment
              io.to('supervisor-room').emit('booking:escalated', {
                ...event,
                statusMessage: 'No porter accepted within 15 seconds. Manual assignment needed.',
              });
              console.log(`[Kafka Bridge] booking:escalated → supervisor-room (${event.bookingId})`);
              break;
          }
        } catch (emitErr) {
          console.error('[Kafka Bridge] Socket emit error on topic', topic, ':', emitErr.message);
          // Non-fatal — continue processing next message
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