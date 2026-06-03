const request = require('supertest');
const app = require('../index');

// Mock the db pool
jest.mock('../db', () => ({
  query: jest.fn(),
}));

const pool = require('../db');

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// DELETE /analytics/user
// REQ-007 AC-1..AC-6
// ---------------------------------------------------------------------------
describe('DELETE /analytics/user', () => {
  it('should return 400 if userId is missing (AC-3)', async () => {
    const res = await request(app).delete('/analytics/user');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_PARAM');
    expect(res.body.error.message).toMatch(/userId is required/);
  });

  it('should return 400 if only startDate is provided without endDate (AC-4)', async () => {
    const res = await request(app).delete('/analytics/user?userId=u1&startDate=2026-04-01');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
  });

  it('should return 400 if only endDate is provided without startDate (AC-4)', async () => {
    const res = await request(app).delete('/analytics/user?userId=u1&endDate=2026-04-30');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
  });

  it('should return 400 if date format is invalid (AC-4)', async () => {
    const res = await request(app).delete('/analytics/user?userId=u1&startDate=01-04-2026&endDate=2026-04-30');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE_FORMAT');
  });

  it('should return 400 if startDate is after endDate (AC-4)', async () => {
    const res = await request(app).delete('/analytics/user?userId=u1&startDate=2026-04-30&endDate=2026-04-01');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE_RANGE');
  });

  it('should delete all events for userId and return deleted count (AC-1)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 7 });
    const res = await request(app).delete('/analytics/user?userId=u1');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(7);
    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM analytics_events/);
    expect(params).toContain('u1');
  });

  it('should return deleted: 0 when no rows match (AC-1 — no-op)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 0 });
    const res = await request(app).delete('/analytics/user?userId=nobody');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(0);
  });

  it('should delete events within date range and return count (AC-2)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 3 });
    const res = await request(app).delete('/analytics/user?userId=u1&startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(3);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/event_time >= \$2::date/);
    expect(params).toEqual(['u1', '2026-04-01', '2026-04-30']);
  });

  it('should return 500 on database error (AC-6)', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).delete('/analytics/user?userId=u1');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(res.body.error.message).toBe('Internal server error');
  });
});

// ---------------------------------------------------------------------------
// DELETE /analytics/device
// REQ-007 AC-7
// ---------------------------------------------------------------------------
describe('DELETE /analytics/device', () => {
  it('should return 400 if deviceId is missing (AC-7)', async () => {
    const res = await request(app).delete('/analytics/device');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_PARAM');
    expect(res.body.error.message).toMatch(/deviceId is required/);
  });

  it('should delete all events for deviceId and return deleted count (AC-7)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 12 });
    const res = await request(app).delete('/analytics/device?deviceId=d1');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(12);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM analytics_events/);
    expect(params).toContain('d1');
  });

  it('should delete events within date range for device (AC-7)', async () => {
    pool.query.mockResolvedValueOnce({ rowCount: 2 });
    const res = await request(app).delete('/analytics/device?deviceId=d1&startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(200);
    expect(res.body.deleted).toBe(2);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/event_time >= \$2::date/);
    expect(params).toEqual(['d1', '2026-04-01', '2026-04-30']);
  });

  it('should return 500 on database error (AC-7)', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).delete('/analytics/device?deviceId=d1');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
