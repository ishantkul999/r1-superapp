require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'travel-service' }));
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

const phase2Response = { phase: 2, status: 'coming_soon', service: 'travel-service' };

app.use('/api/travel', (req, res) => res.json(phase2Response));
app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'travel-service', phase: 2 }));

app.listen(PORT, () => console.log('travel-service scaffold running on :' + PORT));
