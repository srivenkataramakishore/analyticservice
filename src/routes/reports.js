const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireScope } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const VALID_GROUP_BY = ['hour', 'day', 'week', 'month'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATE_RANGE_DAYS = 90;

/**
 * GET /api/v1/analytics/reports
 * Returns aggregated analytics data.
 *
 * Query params:
 *   start_date  (YYYY-MM-DD, required)
 *   end_date    (YYYY-MM-DD, required)
 *   event_type  (string, optional filter)
 *   group_by    (hour|day|week|month, default: day)
 *   page        (integer >= 1, default: 1)
 *   page_size   (integer 1–100, default: 30)
 *
 * Requires scope: analytics:read
 */
router.get('/', requireScope('analytics:read'), rateLimiter, async (req, res) => {
  const {
    start_date,
    end_date,
    event_type,
    group_by = 'day',
    page = '1',
    page_size = '30',
  } = req.query;

  // --- Validate inputs ---
  if (!start_date || !end_date) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'start_date and end_date are required (YYYY-MM-DD)' },
    });
  }
  if (!DATE_REGEX.test(start_date) || !DATE_REGEX.test(end_date)) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'start_date and end_date must be in YYYY-MM-DD format' },
    });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (start > end) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'start_date must be before or equal to end_date' },
    });
  }

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > MAX_DATE_RANGE_DAYS) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: `Date range cannot exceed ${MAX_DATE_RANGE_DAYS} days`,
      },
    });
  }

  if (!VALID_GROUP_BY.includes(group_by)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PAYLOAD',
        message: `group_by must be one of: ${VALID_GROUP_BY.join(', ')}`,
      },
    });
  }

  const pageNum = parseInt(page, 10);
  const pageSizeNum = parseInt(page_size, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'page must be a positive integer' },
    });
  }
  if (isNaN(pageSizeNum) || pageSizeNum < 1 || pageSizeNum > 100) {
    return res.status(400).json({
      error: { code: 'INVALID_PAYLOAD', message: 'page_size must be between 1 and 100' },
    });
  }

  // --- Build query ---
  // date_trunc group_by mapping
  const truncMap = { hour: 'hour', day: 'day', week: 'week', month: 'month' };
  const trunc = truncMap[group_by];

  const params = [start_date, end_date];
  let eventTypeClause = '';
  if (event_type) {
    params.push(event_type);
    eventTypeClause = `AND event_type = $${params.length}`;
  }

  const offset = (pageNum - 1) * pageSizeNum;
  params.push(pageSizeNum, offset);

  try {
    // Count query for pagination
    const countParams = [start_date, end_date];
    let countEventClause = '';
    if (event_type) {
      countParams.push(event_type);
      countEventClause = `AND event_type = $${countParams.length}`;
    }

    const countQuery = `
      SELECT COUNT(DISTINCT date_trunc($1, timestamp)) AS total
      FROM analytics_events
      WHERE timestamp >= $2::date
        AND timestamp < ($3::date + INTERVAL '1 day')
        ${countEventClause}
    `;
    const countResult = await pool.query(countQuery, [trunc, ...countParams]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Data query
    const dataQuery = `
      SELECT
        date_trunc('${trunc}', timestamp)        AS period,
        COUNT(*)                                  AS count,
        COUNT(DISTINCT user_id)                   AS unique_users,
        SUM(COUNT(*)) OVER ()                     AS total_events
      FROM analytics_events
      WHERE timestamp >= $1::date
        AND timestamp < ($2::date + INTERVAL '1 day')
        ${eventTypeClause}
      GROUP BY date_trunc('${trunc}', timestamp)
      ORDER BY period ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const dataResult = await pool.query(dataQuery, params);

    const data = dataResult.rows.map((row) => ({
      period: row.period,
      count: parseInt(row.count, 10),
      unique_users: parseInt(row.unique_users, 10),
    }));

    return res.json({
      data,
      pagination: {
        total,
        page: pageNum,
        page_size: pageSizeNum,
        has_next: pageNum * pageSizeNum < total,
      },
    });
  } catch (err) {
    console.error('Error querying reports:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to query reports' },
    });
  }
});

module.exports = router;
