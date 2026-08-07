const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function makeToken(scopes) {
  return jwt.sign({ sub: 'test-user', scopes }, JWT_SECRET, { expiresIn: '1h' });
}

const writeToken = makeToken(['analytics:write']);
const readToken = makeToken(['analytics:read']);

// Mock DB pool
jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}));

const pool = require('../db');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/v1/analytics/events', () => {
  test('returns 401 when no token provided', async () => {
    const res = await request(app).post('/api/v1/analytics/events').send({ event_type: 'page_view', timestamp: new Date().toISOString(), user_id: 'u1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('returns 403 when token has wrong scope', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('Authorization', `Bearer ${readToken}`)
      .send({ event_type: 'page_view', timestamp: new Date().toISOString(), user_id: 'u1' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('returns 400 when event_type is missing', async () => {
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('Authorization', `Bearer ${writeToken}`)
      .send({ timestamp: new Date().toISOString(), user_id: 'u1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 400 when bulk size exceeds 100', async () => {
    const events = Array.from({ length: 101 }, (_, i) => ({
      event_type: 'click',
      timestamp: new Date().toISOString(),
      user_id: `u${i}`,
    }));
    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('Authorization', `Bearer ${writeToken}`)
      .send(events);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_PAYLOAD');
  });

  test('returns 201 and event_id on successful single ingestion', async () => {
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})  // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'evt-123', created_at: new Date().toISOString() }] }) // INSERT
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    const res = await request(app)
      .post('/api/v1/analytics/events')
      .set('Authorization', `Bearer ${writeToken}`)
      .send({ event_type: 'page_view', timestamp: new Date().toISOString(), user_id: 'u1' });

    expect(res.status).toBe(201);
    expect(res.body.event_id).toBe('evt-123');
  });
});
