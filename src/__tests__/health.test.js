const request = require('supertest');
const app = require('../index');

jest.mock('../db', () => ({ query: jest.fn() }));
const pool = require('../db');

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/analytics/health', () => {
  test('returns 200 with status ok when DB is healthy', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/v1/analytics/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(typeof res.body.uptime_seconds).toBe('number');
  });

  test('returns 503 with status degraded when DB is down', async () => {
    pool.query.mockRejectedValue(new Error('Connection refused'));
    const res = await request(app).get('/api/v1/analytics/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db).toBe('disconnected');
  });
});
