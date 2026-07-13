require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.MAP_SERVICE_PORT || 3010;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// ── GeoJSON: ADI Station layout ──────────────────────────────────────
const ADI_STATION_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5945, 23.0258] },
      properties: { name: 'Ahmedabad Junction (ADI)', type: 'STATION', stationCode: 'ADI' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5942, 23.0260] },
      properties: { name: 'Platform 1 Entry', type: 'PLATFORM', platform: '1' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5948, 23.0256] },
      properties: { name: 'Platform 4 Entry', type: 'PLATFORM', platform: '4' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5943, 23.0261] },
      properties: { name: 'Main Entrance', type: 'ENTRANCE', direction: 'North' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5947, 23.0255] },
      properties: { name: 'South Entrance', type: 'ENTRANCE', direction: 'South' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5941, 23.0259] },
      properties: { name: 'Retiring Rooms', type: 'ROOM', platform: 'Main' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5944, 23.0257] },
      properties: { name: 'Digital Lockers Zone A', type: 'LOCKER', platform: '1' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5949, 23.0254] },
      properties: { name: 'Digital Lockers Zone B', type: 'LOCKER', platform: '4' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5940, 23.0262] },
      properties: { name: 'First Aid Center', type: 'FIRST_AID', platform: 'Main' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5946, 23.0258] },
      properties: { name: 'IRCTC Canteen', type: 'FOOD_STALL', platform: 'Main' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5943, 23.0256] },
      properties: { name: 'SBI ATM', type: 'ATM', platform: 'Main' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5944, 23.0260] },
      properties: { name: 'Restroom P1', type: 'RESTROOM', platform: '1' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5947, 23.0257] },
      properties: { name: 'Restroom P3', type: 'RESTROOM', platform: '3' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5942, 23.0258] },
      properties: { name: 'Porter Zone', type: 'PORTER_ZONE', platform: 'Main' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5945, 23.0263] },
      properties: { name: 'Pre-Paid Auto Stand', type: 'TRANSPORT', subtype: 'AUTO' }
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [72.5944, 23.0264] },
      properties: { name: 'Bus Stop - AMTS', type: 'TRANSPORT', subtype: 'BUS' }
    }
  ]
};

// GET /api/maps/station — ADI station GeoJSON
app.get('/api/maps/station', (req, res) => {
  res.json(ADI_STATION_GEOJSON);
});

// GET /api/maps/facilities — facility POIs (optionally filtered by type)
app.get('/api/maps/facilities', (req, res) => {
  const { type } = req.query;
  let features = ADI_STATION_GEOJSON.features;
  if (type) {
    features = features.filter(f => f.properties.type === type.toUpperCase());
  }
  res.json({ type: 'FeatureCollection', features });
});

// GET /api/maps/porter-locations — live porter locations from Redis
app.get('/api/maps/porter-locations', async (req, res, next) => {
  try {
    const role = req.headers['x-user-role'];
    if (!['SUPERVISOR', 'STATION_CONTROL_ROOM', 'SUPERADMIN'].includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    // Stub — real impl reads porter locations from Redis geo store
    res.json({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [72.5943, 23.0258] },
          properties: { porterId: 'stub-porter-1', badgeNumber: 'P001', isOnline: true, platform: '1' }
        }
      ]
    });
  } catch (err) { next(err); }
});

// GET /api/maps/navigate — simple walking directions between two POIs
app.get('/api/maps/navigate', (req, res) => {
  const { from, to } = req.query;
  // Stub navigation — real impl uses Mapbox Directions API
  res.json({
    from,
    to,
    estimatedWalkMinutes: 3,
    instructions: [
      'From your current location, head towards Platform 1',
      'Walk 50 meters north past the ticket counters',
      'Your destination is on the right'
    ],
    note: 'Navigation stub — real directions require Mapbox token'
  });
});

app.get('/actuator/health', (req, res) => res.json({ status: 'UP', service: 'map-service' }));

app.listen(PORT, () => console.log(`map-service running on :${PORT}`));
module.exports = app;
