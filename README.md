# analyticsservice

API service for Analytics Data backed by Amazon Redshift.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Provide Redshift connection values in environment variables or a `.env` file:

```bash
REDSHIFT_HOST=your-redshift-cluster.example.com
REDSHIFT_PORT=5439
REDSHIFT_DATABASE=analytics_db
REDSHIFT_USER=analytics_user
REDSHIFT_PASSWORD=supersecret
REDSHIFT_SSL=true
PORT=3000
```

## Run

```bash
npm start
```

## Endpoints

### Fetch analytics by user

`GET /analytics/user?userId=<userId>&startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>`

Example:

```bash
curl 'http://localhost:3000/analytics/user?userId=123&startDate=2026-04-01&endDate=2026-04-19'
```

### Fetch analytics by device

`GET /analytics/device?deviceId=<deviceId>&startDate=<YYYY-MM-DD>&endDate=<YYYY-MM-DD>`

Example:

```bash
curl 'http://localhost:3000/analytics/device?deviceId=abc-001&startDate=2026-04-01&endDate=2026-04-19'
```

## Notes

- The service assumes a Redshift table named `analytics_events` with columns `user_id`, `device_id`, `event_time`, and `event_type`.
- Adjust the SQL in `src/index.js` if your schema differs.
