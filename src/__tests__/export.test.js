const request = require('supertest');
const app = require('../index');

jest.mock('../db', () => ({
  query: jest.fn(),
}));

const pool = require('../db');

const VALID_PARAMS = 'format=csv&startDate=2026-01-01&endDate=2026-01-31';

const MOCK_ROWS = [
  {
    user_id: 'user-001',
    device_id: 'dev-abc',
    event_type: 'page_view',
    event_time: '2026-01-15T10:23:00.000Z',
  },
  {
    user_id: 'user-002',
    device_id: 'dev-xyz',
    event_type: 'click',
    event_time: '2026-01-10T08:00:00.000Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /analytics/export', () => {
  // AC-1: CSV happy path
  it('should return 200 with text/csv and correct headers for format=csv', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_ROWS });

    const res = await request(app).get(`/analytics/export?${VALID_PARAMS}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toBe('attachment; filename="export.csv"');
    expect(res.text).toMatch(/^user_id,device_id,event_type,event_time/);
    expect(res.text).toContain('user-001');
  });

  // AC-1: CSV contains correct data rows
  it('should include a header row and one data row per result in CSV', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_ROWS[0]] });

    const res = await request(app).get(`/analytics/export?${VALID_PARAMS}`);
    const lines = res.text.trim().split('\n');

    expect(lines[0]).toBe('user_id,device_id,event_type,event_time');
    expect(lines[1]).toContain('user-001');
    expect(lines.length).toBe(2);
  });

  // AC-2: JSON happy path
  it('should return 200 with application/json and { data: [...] } for format=json', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_ROWS });

    const res = await request(app).get(
      '/analytics/export?format=json&startDate=2026-01-01&endDate=2026-01-31'
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.headers['content-disposition']).toBe('attachment; filename="export.json"');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  // AC-4: missing format
  it('should return 400 INVALID_FORMAT when format is omitted', async () => {
    const res = await request(app).get(
      '/analytics/export?startDate=2026-01-01&endDate=2026-01-31'
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FORMAT');
  });

  // AC-4: invalid format value
  it('should return 400 INVALID_FORMAT when format is not csv or json', async () => {
    const res = await request(app).get(
      '/analytics/export?format=xlsx&startDate=2026-01-01&endDate=2026-01-31'
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_FORMAT');
  });

  // AC-5: missing startDate
  it('should return 400 INVALID_DATE when startDate is missing', async () => {
    const res = await request(app).get('/analytics/export?format=csv&endDate=2026-01-31');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  // AC-5: malformed date
  it('should return 400 INVALID_DATE when startDate is not YYYY-MM-DD', async () => {
    const res = await request(app).get(
      '/analytics/export?format=csv&startDate=01-01-2026&endDate=2026-01-31'
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  // AC-5: startDate after endDate
  it('should return 400 INVALID_DATE when startDate is after endDate', async () => {
    const res = await request(app).get(
      '/analytics/export?format=csv&startDate=2026-02-01&endDate=2026-01-01'
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  // AC-6: range > 90 days
  it('should return 400 DATE_RANGE_TOO_LARGE when range exceeds 90 days', async () => {
    const res = await request(app).get(
      '/analytics/export?format=csv&startDate=2026-01-01&endDate=2026-05-01'
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DATE_RANGE_TOO_LARGE');
  });

  // Optional filters: userId applied
  it('should pass userId as a SQL parameter when provided', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_ROWS[0]] });

    const res = await request(app).get(
      '/analytics/export?format=csv&startDate=2026-01-01&endDate=2026-01-31&userId=user-001'
    );

    expect(res.status).toBe(200);
    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[1]).toContain('user-001');
  });

  // Optional filters: eventType applied
  it('should pass eventType as a SQL parameter when provided', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_ROWS[0]] });

    const res = await request(app).get(
      '/analytics/export?format=csv&startDate=2026-01-01&endDate=2026-01-31&eventType=page_view'
    );

    expect(res.status).toBe(200);
    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[1]).toContain('page_view');
  });

  // AC-7: DB error
  it('should return 500 with EXPORT_FAILED error code on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));

    const res = await request(app).get(`/analytics/export?${VALID_PARAMS}`);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('EXPORT_FAILED');
    expect(res.body.error.message).not.toMatch(/DB connection failed/);
  });
});
