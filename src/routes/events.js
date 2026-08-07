const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireScope } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const MAX_BULK_SIZE = 100;

function validateEvent(event) {
  const errors = [];
  if (!event.event_type || typeof event.event_type !== 'string') {
    errors.push('event_type is required and must be a string');
  }
  if (!event.timestamp) {
    errors.push('timestamp is required');
  } else if (isNaN(Date.parse(event.timestamp))) {
    errors.push('timestamp must be a valid ISO 8601 date string');
  }
  if (!event.user_id || typeof event.user_id !== 'string') {
    errors.push('user_id is required and must be a string');
  }
  return errors;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (key.length > 50) continue;
    const strVal = String(value).slice(0, 500);
    sanitized[key.slice(0, 50)] = strVal;
  }
  return sanitized;
}

/**
 * POST /api/v1/analytics/events
 * Ingest a single event or an array of up to 100 events.
 * Requires scope: analytics:write
 */
router.post('/', requireScope('analytics:write'), rateLimiter, async (req, res) => {
  const body = req.body;
  const isArray = Array.isArray(body);
  const events = isArray ? body : [body];

  if (events.length === 0) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'At least one event is required' },
    });
  }

  if (events.length > MAX_BULK_SIZE) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: `Bulk ingestion supports a maximum of ${MAX_BULK_SIZE} events per request`,
      },
    });
  }

  // Validate all events
  const validationErrors = [];
  events.forEach((event, index) => {
    const errs = validateEvent(event);
    if (errs.length > 0) {
      validationErrors.push({ index, errors: errs });
    }
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'One or more events failed validation',
        details: validationErrors,
      },
    });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertedIds = [];
      for (const event of events) {
        const metadata = sanitizeMetadata(event.metadata);
        const result = await client.query(
          `INSERT INTO analytics_events (event_type, user_id, timestamp, metadata)
           VALUES ($1, $2, $3, $4)
           RETURNING id, created_at`,
          [event.event_type, event.user_id, event.timestamp, metadata ? JSON.stringify(metadata) : null]
        );
        insertedIds.push({
          event_id: result.rows[0].id,
          created_at: result.rows[0].created_at,
        });
      }

      await client.query('COMMIT');

      if (isArray) {
        return res.status(201).json({ inserted: insertedIds });
      } else {
        return res.status(201).json(insertedIds[0]);
      }
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error ingesting events:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to ingest events' },
    });
  }
});

module.exports = router;
