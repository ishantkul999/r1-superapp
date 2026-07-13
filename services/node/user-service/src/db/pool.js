const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_NODE ||
    `postgresql://${process.env.POSTGRES_USER || 'r1user'}:${process.env.POSTGRES_PASSWORD || 'r1password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'r1superapp'}`,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err);
});

module.exports = pool;
