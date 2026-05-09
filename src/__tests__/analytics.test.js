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

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /analytics/user', () => {
  it('should return 400 if userId is missing', async () => {
    const res = await request(app).get('/analytics/user?startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/userId is required/);
  });

  it('should return 400 if startDate is missing', async () => {
    const res = await request(app).get('/analytics/user?userId=123&endDate=2026-04-19');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/startDate and endDate are required/);
  });

  it('should return 400 if date format is invalid', async () => {
    const res = await request(app).get('/analytics/user?userId=123&startDate=01-04-2026&endDate=2026-04-19');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/YYYY-MM-DD/);
  });

  it('should return 400 if startDate is after endDate', async () => {
    const res = await request(app).get('/analytics/user?userId=123&startDate=2026-04-19&endDate=2026-04-01');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/startDate must be before/);
  });

  it('should return analytics data for valid request', async () => {
    const mockRows = [
      { user_id: '123', device_id: 'abc', event_type: 'click', event_time: '2026-04-10T10:00:00Z' },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockRows });

    const res = await request(app).get('/analytics/user?userId=123&startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('123');
    expect(res.body.count).toBe(1);
    expect(res.body.data).toEqual(mockRows);
  });

  it('should return 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).get('/analytics/user?userId=123&startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('GET /analytics/device', () => {
  it('should return 400 if deviceId is missing', async () => {
    const res = await request(app).get('/analytics/device?startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/deviceId is required/);
  });

  it('should return analytics data for valid request', async () => {
    const mockRows = [
      { device_id: 'abc-001', user_id: '123', event_type: 'pageview', event_time: '2026-04-10T09:00:00Z' },
    ];
    pool.query.mockResolvedValueOnce({ rows: mockRows });

    const res = await request(app).get('/analytics/device?deviceId=abc-001&startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(200);
    expect(res.body.deviceId).toBe('abc-001');
    expect(res.body.count).toBe(1);
    expect(res.body.data).toEqual(mockRows);
  });

  it('should return 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).get('/analytics/device?deviceId=abc-001&startDate=2026-04-01&endDate=2026-04-19');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('GET /analytics/event', () => {
  it('should return 400 if eventType is missing', async () => {
    const res = await request(app).get('/analytics/event?startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/eventType is required/);
  });

  it('should return 400 if startDate is missing', async () => {
    const res = await request(app).get('/analytics/event?eventType=click&endDate=2026-04-30');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/startDate and endDate are required/);
  });

  it('should return 400 if date format is invalid', async () => {
    const res = await request(app).get('/analytics/event?eventType=click&startDate=01-04-2026&endDate=2026-04-30');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/YYYY-MM-DD/);
  });

  it('should return 400 if startDate is after endDate', async () => {
    const res = await request(app).get('/analytics/event?eventType=click&startDate=2026-04-30&endDate=2026-04-01');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/startDate must be before/);
  });

  it('should return analytics data with dailySummary for valid request', async () => {
    const mockSummaryRows = [
      { date: '2026-04-10', count: '2' },
      { date: '2026-04-15', count: '1' },
    ];
    const mockDetailRows = [
      { user_id: '123', device_id: 'abc', event_type: 'click', event_time: '2026-04-10T10:00:00Z' },
      { user_id: '456', device_id: 'xyz', event_type: 'click', event_time: '2026-04-10T09:00:00Z' },
      { user_id: '789', device_id: 'def', event_type: 'click', event_time: '2026-04-15T14:00:00Z' },
    ];
    pool.query
      .mockResolvedValueOnce({ rows: mockSummaryRows })
      .mockResolvedValueOnce({ rows: mockDetailRows });

    const res = await request(app).get('/analytics/event?eventType=click&startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(200);
    expect(res.body.eventType).toBe('click');
    expect(res.body.count).toBe(3);
    expect(res.body.dailySummary).toEqual([
      { date: '2026-04-10', count: 2 },
      { date: '2026-04-15', count: 1 },
    ]);
    expect(res.body.data).toEqual(mockDetailRows);
  });

  it('should return empty data when no events found', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/analytics/event?eventType=unknown&startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.dailySummary).toEqual([]);
    expect(res.body.data).toEqual([]);
  });

  it('should return 500 on database error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB connection failed'));
    const res = await request(app).get('/analytics/event?eventType=click&startDate=2026-04-01&endDate=2026-04-30');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

describe('GET unknown route', () => {
  it('should return 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
