const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * Validate common query params: startDate, endDate
 */
function validateDateRange(startDate, endDate, res) {
  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate are required (YYYY-MM-DD)' });
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    res.status(400).json({ error: 'startDate and endDate must be in YYYY-MM-DD format' });
    return false;
  }
  if (new Date(startDate) > new Date(endDate)) {
    res.status(400).json({ error: 'startDate must be before or equal to endDate' });
    return false;
  }
  return true;
}

/**
 * GET /analytics/user
 * Query params: userId, startDate, endDate
 */
router.get('/user', async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!validateDateRange(startDate, endDate, res)) return;

  try {
    const query = `
      SELECT
        user_id,
        device_id,
        event_type,
        event_time
      FROM analytics_events
      WHERE user_id = $1
        AND event_time >= $2::date
        AND event_time < ($3::date + INTERVAL '1 day')
      ORDER BY event_time DESC
    `;
    const { rows } = await pool.query(query, [userId, startDate, endDate]);
    return res.json({
      userId,
      startDate,
      endDate,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error('Error fetching analytics by user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /analytics/device
 * Query params: deviceId, startDate, endDate
 */
router.get('/device', async (req, res) => {
  const { deviceId, startDate, endDate } = req.query;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId is required' });
  }
  if (!validateDateRange(startDate, endDate, res)) return;

  try {
    const query = `
      SELECT
        device_id,
        user_id,
        event_type,
        event_time
      FROM analytics_events
      WHERE device_id = $1
        AND event_time >= $2::date
        AND event_time < ($3::date + INTERVAL '1 day')
      ORDER BY event_time DESC
    `;
    const { rows } = await pool.query(query, [deviceId, startDate, endDate]);
    return res.json({
      deviceId,
      startDate,
      endDate,
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error('Error fetching analytics by device:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
