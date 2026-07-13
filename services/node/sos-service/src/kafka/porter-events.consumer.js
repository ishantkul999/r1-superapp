'use strict';
/**
 * porter-events.consumer.js — NEW FILE
 *
 * DROP AT:
 *   services/node/sos-service/src/kafka/porter-events.consumer.js
 *
 * WHY THIS LIVES IN sos-service:
 *   sos-service already runs a Socket.io server on port 3006, and the
 *   socket.handlers.js already defines rooms for 'supervisor-room',
 *   'porter:{porterId}', and 'user:{userId}' — but nothing was publishing
 *   to them for booking events. porter-service (Spring Boot) already
 *   publishes to Kafka topics porter.booked / porter.assigned / porter.completed
 *   via PorterEventProducer.java — we just need a consumer to re-broadcast
 *   those events over the existing Socket.io connection.
 *
 * THIS SOLVES:
 *   "I WANT AS SOON AS USER BOOKS A PORTER IT SHOULD IMMEDIATELY REFLECT ON
 *    BOTH PORTER AS WELL AS SUPERVISOR SIDE"
 *
 * FLOW:
 *   1. User books porter → porter-service saves booking, publishes Kafka
 *      event to topic "porter.booked"
 *   2. This consumer picks it up, emits Socket.io event "booking:new" to
 *      the 'supervisor-room' (so all supervisors see the new pending request
 *      instantly) AND to 'user:{userId}' (so the passenger sees "Finding a
 *      porter..." update live)
 *   3. When a porter accepts → porter-service publishes "porter.assigned"
 *      → this consumer emits "booking:assigned" to 'user:{userId}' and
 *      removes it from supervisors' pending queue view
 *   4. supervisor-assignment-escalated (NEW topic, see below) → emitted when
 *      the 15s timer in SupervisorAssignmentScheduler.java expires → pushes
 *      to 'supervisor-room' so supervisors see it needs manual/offline assignment
 */
const { Kafka } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const kafka = new Kafka({ clientId: 'sos-service-bridge', brokers: KAFKA_BROKERS, retry: { retries: 3 } });

const TOPICS = [
  'porter.booked',
  'porter.assigned',
  'porter.completed',
  'supervisor.escalation',   // NEW — published when 15s timer expires (see scheduler patch)
];

async function startPorterEventsConsumer(io) {
  const consumer = kafka.consumer({ groupId: 'sos-service-socket-bridge' });

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: TOPICS, fromBeginning: false });

    console.log('[Kafka Bridge] Subscribed to porter event topics for real-time Socket.io push');

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        let event;
        try {
          event = JSON.parse(message.value.toString());
        } catch (e) {
          console.error('[Kafka Bridge] Failed to parse message:', e.message);
          return;
        }

        switch (topic) {
          case 'porter.booked':
            // New booking created — notify ALL supervisors instantly + the passenger
            io.to('supervisor-room').emit('booking:new', event);
            if (event.userId) {
              io.to(`user:${event.userId}`).emit('booking:status', {
                ...event, statusMessage: 'Finding a porter for you…',
              });
            }
            console.log(`[Kafka Bridge] booking:new → supervisor-room, user:${event.userId}`);
            break;

          case 'porter.assigned':
            // A porter accepted — notify the passenger and remove from supervisor's pending view
            if (event.userId) {
              io.to(`user:${event.userId}`).emit('booking:assigned', {
                ...event, statusMessage: 'A porter has been assigned and is on the way!',
              });
            }
            io.to('supervisor-room').emit('booking:removed-from-queue', { bookingId: event.bookingId });
            // Also notify the specific porter's personal room (in case they have multiple tabs/devices)
            if (event.porterId) {
              io.to(`porter:${event.porterId}`).emit('job:assigned', event);
            }
            console.log(`[Kafka Bridge] booking:assigned → user:${event.userId}, porter:${event.porterId}`);
            break;

          case 'porter.completed':
            if (event.userId) {
              io.to(`user:${event.userId}`).emit('booking:completed', event);
            }
            console.log(`[Kafka Bridge] booking:completed → user:${event.userId}`);
            break;

          case 'supervisor.escalation':
            // 15-second timer expired — booking needs manual/offline porter assignment
            io.to('supervisor-room').emit('booking:escalated', {
              ...event,
              statusMessage: 'No porter accepted within 15 seconds — manual assignment needed',
            });
            console.log(`[Kafka Bridge] booking:escalated → supervisor-room (bookingId=${event.bookingId})`);
            break;
        }
      },
    });
  } catch (err) {
    console.error('[Kafka Bridge] Consumer failed to start:', err.message);
    console.error('[Kafka Bridge] Real-time booking push will NOT work until Kafka is reachable.');
    // Non-fatal — sos-service continues running without the bridge.
    // Retry connection every 30s.
    setTimeout(() => startPorterEventsConsumer(io), 30000);
  }
}

module.exports = { startPorterEventsConsumer };
