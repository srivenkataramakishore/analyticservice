const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function makeToken(scopes) {
  return jwt.sign({ sub: 'test-user', scopes }, JWT_SECRET, { expiresIn: '1h' });
}

const readToken = makeToken(['analytics:read']);
const writeToken = makeToken(['analytics:write']);

jest.mock('../db', () => ({ query: jest.fn() }));
const pool = require('../db');

beforeEach(() => jest.clearAllMocks());

describe('GET /api/v1/analytics/reports', () => {
  test('returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/analytics/reports?start_date=2026-01-01&end_date=2026-01-31');
    expect(res.status).toBe(401);
  });

  test('returns 403 with write-only token', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/reports?start_date=2026-01-01&end_date=2026-01-31')
      .set('Authorization', `Bearer ${writeToken}`);
    expect(res.status).toBe(403);
  });

  test('returns 400 when start_date missing', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/reports?end_date=2026-01-31')
      .set('Authorization', `Bearer ${readToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 400 when date range exceeds 90 days', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/reports?start_date=2026-01-01&end_date=2026-05-30')
      .set('Authorization', `Bearer ${readToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 400 for invalid group_by value', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/reports?start_date=2026-05-01&end_date=2026-05-30&group_by=year')
      .set('Authorization', `Bearer ${readToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 200 with paginated data', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { period: '2026-05-01T00:00:00.000Z', count: '120', unique_users: '30', total_events: '500' },
          { period: '2026-05-02T00:00:00.000Z', count: '95',  unique_users: '22', total_events: '500' },
        ],
      });

    const res = await request(app)
      .get('/api/v1/analytics/reports?start_date=2026-05-01&end_date=2026-05-30&group_by=day')
      .set('Authorization', `Bearer ${readToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.has_next).toBe(false);
  });
});
