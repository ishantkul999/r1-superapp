require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

const phase2Response = { phase: 2, status: 'coming_soon', service: 'stay-service' };

app.use('/api/stay', (req, res) => res.json(phase2Response));
app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'stay-service', phase: 2 }));

app.listen(PORT, () => console.log('stay-service scaffold running on :' + PORT));
