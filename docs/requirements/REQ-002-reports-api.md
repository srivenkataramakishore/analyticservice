# REQ-002: Analytics query / reports API

| Field | Value |
|-------|-------|
| **ID** | REQ-002 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) |
| **Type** | API |
| **Status** | Implemented |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | [PR #3](https://github.com/srivenkataramakishore/analyticservice/pull/3) |

## Description
Provide a `GET /api/v1/analytics/reports` endpoint that returns aggregated, paginated event data with flexible time-series grouping and filtering by event type.

## User stories
- As a **data analyst**, I want to query aggregated event counts grouped by day/week/month so that I can identify trends over time.
- As a **dashboard engineer**, I want a paginated reports endpoint so that the UI can load data incrementally without timeouts.
- As a **product manager**, I want to filter reports by event type so that I can measure specific user actions independently.

## Scope
**In scope:**
- Filtering by `start_date`, `end_date`, `event_type`
- Time-series grouping by `hour`, `day`, `week`, `month`
- Pagination via `page` and `page_size` (max 100)
- Aggregations: count, unique users
- Max date range: 90 days

**Out of scope:**
- Querying archived data (deferred — see REQ-005)
- Real-time / streaming queries
- Custom aggregation functions

## Data flow
```
Client
  ↓  GET /api/v1/analytics/reports?start_date=...&end_date=...&group_by=day
Auth middleware (JWT, analytics:read scope)
  ↓
Input validation (dates, group_by, pagination)
  ↓
SELECT date_trunc, COUNT(*), COUNT(DISTINCT user_id)
FROM analytics_events
WHERE timestamp BETWEEN start_date AND end_date
GROUP BY date_trunc
ORDER BY period ASC
LIMIT page_size OFFSET offset
  ↓
Response: { data: [...], pagination: { total, page, page_size, has_next } }
```

## Acceptance criteria
- [x] **AC-1**: Given valid params `start_date`, `end_date`, `group_by=day`, when called with `analytics:read` token, then the API returns `200` with `{ data: [...], pagination: { total, page, page_size, has_next } }`.
- [x] **AC-2**: Given `group_by` set to `hour`, `day`, `week`, or `month`, then results are correctly bucketed.
- [x] **AC-3**: Given `event_type` filter param, then only events of that type are included in results.
- [x] **AC-4**: Given a date range exceeding 90 days, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-5**: Given `start_date` after `end_date`, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-6**: Given no token, then `401`; wrong scope, then `403`.

## NFR checklist
- [x] **Perf** — p95 latency < 500 ms for 90-day date ranges (NFR-P2)
- [x] **Security** — requires `analytics:read` scope (NFR-S1, NFR-S2)
- [x] **Security** — parameterised SQL only (NFR-S8)
- [x] **Reliability** — consistent error envelope (NFR-R4)
- [x] **Observability** — structured JSON log per request (NFR-O1)
- [x] **Data** — indexes on `event_type`, `timestamp`, `user_id` (NFR-D3)

## Dependencies
- `src/db.js` connection pool
- `analytics_events` table + indexes (REQ-001)
- JWT auth service

## Open questions
- Should archived data be queryable via `?include_archive=true`? — **TBD (see REQ-005)**

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Max date range 90 days | Prevents runaway queries on large datasets; aligns with archival threshold |
| 2026-05-30 | Max page_size 100 | Prevents oversized response payloads |
