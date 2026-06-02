const pool = require('../db');

/**
 * Query analytics_events for export.
 * All values are passed as parameterised SQL arguments.
 *
 * @param {{ startDate: string, endDate: string, userId?: string, eventType?: string }} params
 * @returns {Promise<Array<{ user_id, device_id, event_type, event_time }>>}
 */
async function queryEvents({ startDate, endDate, userId, eventType }) {
  const values = [startDate, endDate];
  const conditions = [
    'event_time >= $1::date',
    'event_time < ($2::date + INTERVAL \'1 day\')',
  ];

  if (userId) {
    conditions.push(`user_id = $${values.length + 1}`);
    values.push(userId);
  }

  if (eventType) {
    conditions.push(`event_type = $${values.length + 1}`);
    values.push(eventType);
  }

  const sql = `
    SELECT user_id, device_id, event_type, event_time
    FROM analytics_events
    WHERE ${conditions.join(' AND ')}
    ORDER BY event_time DESC
  `;

  const { rows } = await pool.query(sql, values);
  return rows;
}

/**
 * Serialise rows into the requested format string.
 *
 * @param {Array<object>} rows
 * @param {'csv' | 'json'} format
 * @returns {string}
 */
function serialise(rows, format) {
  if (format === 'json') {
    return JSON.stringify({ data: rows });
  }

  // CSV
  const header = 'user_id,device_id,event_type,event_time';
  const lines = rows.map((row) => [
    row.user_id,
    row.device_id,
    row.event_type,
    row.event_time instanceof Date
      ? row.event_time.toISOString()
      : String(row.event_time),
  ].join(','));

  return [header, ...lines].join('\n');
}

module.exports = { queryEvents, serialise };
