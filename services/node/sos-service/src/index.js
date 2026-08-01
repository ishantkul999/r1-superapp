require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const sosRoutes = require('./routes/sos.routes');
const { setupSocketHandlers } = require('./socket/socket.handlers');
const { startPorterEventsConsumer } = require('./kafka/porter-events.consumer'); // NEW
const { startNotificationEventsConsumer } = require('./kafka/notification-events.consumer'); // NEW

const app = express();

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'sos-service' }));
const server = http.createServer(app);
const PORT = process.env.SOS_SERVICE_PORT || 3006;

// ── Socket.io ──────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io available to routes
app.set('io', io);

// ── Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ── Routes ──────────────────────────────────────────────────────────
app.use('/api/sos', sosRoutes);

// ── Health ──────────────────────────────────────────────────────────
app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'sos-service' }));

// ── Error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SOS ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Socket Handlers ─────────────────────────────────────────────────
setupSocketHandlers(io);

startPorterEventsConsumer(io);

startNotificationEventsConsumer(io);

server.listen(PORT, () => console.log(`sos-service running on :${PORT}`));
module.exports = { app, io };