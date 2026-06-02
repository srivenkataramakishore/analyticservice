const express = require('express');
const router = express.Router();
const pool = require('../db');
const { validateExportParams } = require('../export/export-validator');
const { queryEvents, serialise } = require('../export/export-service');

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

/**
 * GET /analytics/export
 * REQ-006 — KN-4
 * Query params: format (csv|json), startDate, endDate, userId?, eventType?
 */
router.get('/export', async (req, res) => {
  const validationError = validateExportParams(req.query);
  if (validationError) {
    return res.status(validationError.status).json({
      error: {
        code: validationError.code,
        message: validationError.message,
      },
    });
  }

  const { format, startDate, endDate, userId, eventType } = req.query;

  try {
    const rows = await queryEvents({ startDate, endDate, userId, eventType });
    const body = serialise(rows, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="export.json"');
    }

    return res.status(200).send(body);
  } catch (err) {
    console.error('Error exporting analytics data:', err);
    return res.status(500).json({
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export analytics data',
      },
    });
  }
});

module.exports = router;
