const express = require('express');
const router = express.Router();
const pool = require('../db');

// TODO(KN-5): wire JWT middleware here once auth service is available.
// All DELETE endpoints require analytics:write scope (NFR-S1, NFR-S2).

/**
 * Validate common query params: startDate, endDate.
 * Returns true if valid (or both absent), false otherwise (and sends the error).
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
 * Validate optional date range for delete endpoints.
 * If both are absent — OK (no range filter).
 * If only one is present — 400.
 * If both present — delegate to full validateDateRange.
 */
function validateOptionalDateRange(startDate, endDate, res) {
  const hasStart = startDate !== undefined && startDate !== null && startDate !== '';
  const hasEnd = endDate !== undefined && endDate !== null && endDate !== '';
  if (!hasStart && !hasEnd) return true;
  if (hasStart !== hasEnd) {
    res.status(400).json({
      error: {
        code: 'INVALID_DATE_RANGE',
        message: 'Both startDate and endDate must be provided together',
      },
    });
    return false;
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    res.status(400).json({
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: 'startDate and endDate must be in YYYY-MM-DD format',
      },
    });
    return false;
  }
  if (new Date(startDate) > new Date(endDate)) {
    res.status(400).json({
      error: {
        code: 'INVALID_DATE_RANGE',
        message: 'startDate must be before or equal to endDate',
      },
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// GET /analytics/user
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// GET /analytics/device
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// DELETE /analytics/user
// Deletes all events for a userId, optionally scoped to a date range.
// REQ-007 / KN-5
// ---------------------------------------------------------------------------
router.delete('/user', async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  if (!userId) {
    return res.status(400).json({
      error: { code: 'MISSING_PARAM', message: 'userId is required' },
    });
  }
  if (!validateOptionalDateRange(startDate, endDate, res)) return;

  try {
    let result;
    if (startDate && endDate) {
      result = await pool.query(
        `DELETE FROM analytics_events
         WHERE user_id = $1
           AND event_time >= $2::date
           AND event_time < ($3::date + INTERVAL '1 day')`,
        [userId, startDate, endDate]
      );
    } else {
      result = await pool.query(
        'DELETE FROM analytics_events WHERE user_id = $1',
        [userId]
      );
    }
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Error deleting analytics by user:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

// ---------------------------------------------------------------------------
// DELETE /analytics/device
// Deletes all events for a deviceId, optionally scoped to a date range.
// REQ-007 / KN-5
// ---------------------------------------------------------------------------
router.delete('/device', async (req, res) => {
  const { deviceId, startDate, endDate } = req.query;

  if (!deviceId) {
    return res.status(400).json({
      error: { code: 'MISSING_PARAM', message: 'deviceId is required' },
    });
  }
  if (!validateOptionalDateRange(startDate, endDate, res)) return;

  try {
    let result;
    if (startDate && endDate) {
      result = await pool.query(
        `DELETE FROM analytics_events
         WHERE device_id = $1
           AND event_time >= $2::date
           AND event_time < ($3::date + INTERVAL '1 day')`,
        [deviceId, startDate, endDate]
      );
    } else {
      result = await pool.query(
        'DELETE FROM analytics_events WHERE device_id = $1',
        [deviceId]
      );
    }
    return res.json({ deleted: result.rowCount });
  } catch (err) {
    console.error('Error deleting analytics by device:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    });
  }
});

module.exports = router;
