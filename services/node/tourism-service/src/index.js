require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'tourism-service' }));
const PORT = process.env.PORT || 3004;

app.use(helmet());
app.use(cors());
app.use(express.json());

const phase2Response = { phase: 2, status: 'coming_soon', service: 'tourism-service' };

app.use('/api/tourism', (req, res) => res.json(phase2Response));
app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'tourism-service', phase: 2 }));

app.listen(PORT, () => console.log('tourism-service scaffold running on :' + PORT));

