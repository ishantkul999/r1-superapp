require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('redis');

const app = express();

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'train-service' }));
const PORT = process.env.TRAIN_SERVICE_PORT || 3011;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Redis client
let redis;
(async () => {
  redis = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD || 'r1redispass'}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`
  });
  redis.on('error', (err) => console.error('Train Redis error:', err.message));
  await redis.connect();
  app.set('redis', redis);
})();

app.use('/api/train', require('./routes/train.routes'));

app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'train-service' }));

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`train-service running on :${PORT}`));
module.exports = app;
