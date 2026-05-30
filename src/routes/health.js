const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/v1/analytics/health
 * Returns service and DB connectivity status.
 * Does not require auth — suitable for load balancer health checks.
 */
router.get('/', async (req, res) => {
  const startTime = process.hrtime.bigint();
  let dbStatus = 'connected';

  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'disconnected';
  }

  const uptimeSeconds = Math.floor(process.uptime());
  const status = dbStatus === 'connected' ? 'ok' : 'degraded';
  const httpStatus = status === 'ok' ? 200 : 503;

  return res.status(httpStatus).json({
    status,
    db: dbStatus,
    uptime_seconds: uptimeSeconds,
  });
});

module.exports = router;
