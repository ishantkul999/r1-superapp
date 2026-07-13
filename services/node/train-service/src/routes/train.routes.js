const express = require('express');
const router = express.Router();
const axios = require('axios');

const NTES_API_KEY = process.env.NTES_API_KEY || 'stub';
const NTES_BASE_URL = process.env.NTES_API_BASE_URL || 'https://api.railwayapi.site';
const PNR_CACHE_TTL = 5 * 60;       // 5 minutes
const SCHEDULE_CACHE_TTL = 2 * 60;  // 2 minutes
const ADI_STATION_CODE = 'ADI';

// ── PNR Status ───────────────────────────────────────────────────────
router.get('/pnr/:pnrNo', async (req, res, next) => {
  try {
    const { pnrNo } = req.params;
    if (!/^\d{10}$/.test(pnrNo)) {
      return res.status(400).json({ error: 'Invalid PNR. Must be 10 digits.' });
    }

    const redis = req.app.get('redis');
    const cacheKey = `pnr:${pnrNo}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...JSON.parse(cached), cached: true });
    }

    let pnrData;
    if (NTES_API_KEY === 'stub') {
      pnrData = generateStubPnrData(pnrNo);
    } else {
      const response = await axios.get(`${NTES_BASE_URL}/pnr-status/${pnrNo}`, {
        headers: { 'x-api-key': NTES_API_KEY },
        timeout: 8000
      });
      pnrData = response.data;
    }

    await redis.setEx(cacheKey, PNR_CACHE_TTL, JSON.stringify(pnrData));
    res.json({ ...pnrData, cached: false });
  } catch (err) { next(err); }
});

// ── Train Live Status ─────────────────────────────────────────────────
router.get('/status/:trainNo', async (req, res, next) => {
  try {
    const { trainNo } = req.params;
    const redis = req.app.get('redis');
    const cacheKey = `train:status:${trainNo}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ ...JSON.parse(cached), cached: true });

    let data;
    if (NTES_API_KEY === 'stub') {
      data = generateStubTrainStatus(trainNo);
    } else {
      const response = await axios.get(`${NTES_BASE_URL}/train-status/${trainNo}`, {
        headers: { 'x-api-key': NTES_API_KEY },
        timeout: 8000
      });
      data = response.data;
    }

    await redis.setEx(cacheKey, SCHEDULE_CACHE_TTL, JSON.stringify(data));
    res.json({ ...data, cached: false });
  } catch (err) { next(err); }
});

// ── Station Board (trains at ADI next 4 hours) ────────────────────────
router.get('/station-board', async (req, res, next) => {
  try {
    const stationCode = req.query.station || ADI_STATION_CODE;
    const redis = req.app.get('redis');
    const cacheKey = `station:board:${stationCode}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ ...JSON.parse(cached), cached: true });

    let data;
    if (NTES_API_KEY === 'stub') {
      data = generateStubStationBoard(stationCode);
    } else {
      const response = await axios.get(`${NTES_BASE_URL}/station-board/${stationCode}`, {
        headers: { 'x-api-key': NTES_API_KEY },
        timeout: 8000
      });
      data = response.data;
    }

    await redis.setEx(cacheKey, SCHEDULE_CACHE_TTL, JSON.stringify(data));
    res.json({ ...data, cached: false });
  } catch (err) { next(err); }
});

// ── Stub Data Generators ──────────────────────────────────────────────

function generateStubPnrData(pnrNo) {
  return {
    pnrNo,
    trainNo: '12009',
    trainName: 'Shatabdi Express',
    dateOfJourney: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    from: 'ADI',
    to: 'MMCT',
    reservationUpto: 'MMCT',
    boardingPoint: 'ADI',
    passengers: [
      { number: 1, bookingStatus: 'CNF', currentStatus: 'CNF', coachNo: 'CC1', berth: '32' },
      { number: 2, bookingStatus: 'CNF', currentStatus: 'CNF', coachNo: 'CC1', berth: '33' }
    ],
    chartPrepared: false,
    class: 'CC',
    quota: 'GN'
  };
}

function generateStubTrainStatus(trainNo) {
  return {
    trainNo,
    trainName: 'Shatabdi Express',
    currentStation: 'VAPI',
    lastUpdated: new Date().toISOString(),
    delay: 5,
    nextStation: 'ST',
    expectedArrival: new Date(Date.now() + 3600000).toISOString(),
    stations: [
      { code: 'ADI', name: 'Ahmedabad Junction', scheduledDep: '06:05', actualDep: '06:08', status: 'DEPARTED' },
      { code: 'VAPI', name: 'Vapi', scheduledArr: '09:15', actualArr: '09:20', status: 'DEPARTED' },
      { code: 'MMCT', name: 'Mumbai Central', scheduledArr: '11:40', actualArr: null, status: 'UPCOMING' }
    ]
  };
}

function generateStubStationBoard(stationCode) {
  const now = new Date();
  return {
    stationCode,
    stationName: 'Ahmedabad Junction',
    trains: [
      {
        trainNo: '12009', trainName: 'Shatabdi Express', type: 'ARR',
        scheduledTime: new Date(now.getTime() + 30 * 60000).toTimeString().slice(0,5),
        expectedTime: new Date(now.getTime() + 35 * 60000).toTimeString().slice(0,5),
        from: 'MMCT', platform: '1', delay: 5, status: 'ON_TIME'
      },
      {
        trainNo: '12010', trainName: 'Shatabdi Express', type: 'DEP',
        scheduledTime: new Date(now.getTime() + 60 * 60000).toTimeString().slice(0,5),
        expectedTime: new Date(now.getTime() + 60 * 60000).toTimeString().slice(0,5),
        to: 'MMCT', platform: '2', delay: 0, status: 'ON_TIME'
      },
      {
        trainNo: '12957', trainName: 'Rajdhani Express', type: 'DEP',
        scheduledTime: new Date(now.getTime() + 90 * 60000).toTimeString().slice(0,5),
        expectedTime: new Date(now.getTime() + 100 * 60000).toTimeString().slice(0,5),
        to: 'NDLS', platform: '4', delay: 10, status: 'DELAYED'
      },
      {
        trainNo: '19016', trainName: 'Saurashtra Express', type: 'ARR',
        scheduledTime: new Date(now.getTime() + 120 * 60000).toTimeString().slice(0,5),
        expectedTime: new Date(now.getTime() + 120 * 60000).toTimeString().slice(0,5),
        from: 'MMCT', platform: '3', delay: 0, status: 'ON_TIME'
      }
    ],
    generatedAt: now.toISOString()
  };
}

module.exports = router;
