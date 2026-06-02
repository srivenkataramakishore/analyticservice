# REQ-006: Data Export Functionality

| Field | Value |
|-------|-------|
| **ID** | REQ-006 |
| **Jira ticket** | [KN-4](https://srivenkatarama.atlassian.net/browse/KN-4) |
| **Type** | API |
| **Status** | Approved |
| **Author** | Kishore Chivukula |
| **Date** | 2026-06-02 |
| **Figma** | — |
| **PR / Commit** | — |

## Description

Allow authenticated API consumers to export analytics event data from the `analytics_events` table as a downloadable file. The export supports CSV and JSON formats and can be scoped to a date range, a specific user ID, and/or a specific event type.

## User stories

- As an **API consumer**, I want to download all analytics events for a date range as a CSV so that I can analyse them in a spreadsheet tool.
- As an **API consumer**, I want to download events filtered by user ID and/or event type so that I can extract a targeted subset without post-processing.
- As an **API consumer**, I want to choose between CSV and JSON output formats so that I can integrate the export into downstream pipelines.

## Scope

**In scope:**
- `GET /api/v1/analytics/export` endpoint
- Query params: `format` (csv | json), `startDate`, `endDate`, `userId` (optional), `eventType` (optional)
- Response: file download with correct `Content-Type` and `Content-Disposition` headers
- JWT Bearer auth (scope: `analytics:read`)
- Input validation (date format, enum check on format)
- Max 90-day date range per request to protect DB performance

**Out of scope:**
- Async / background export jobs (no job queue, no email delivery)
- Excel (.xlsx) format
- Pagination or cursor-based streaming beyond the 90-day cap
- Export scheduling

## Data flow

```
Client → GET /api/v1/analytics/export?format=csv&startDate=…&endDate=…
       → Auth middleware (JWT, analytics:read scope)
       → Input validation middleware
       → Export route handler
       → Pool query on analytics_events (parameterised, ORDER BY event_time DESC)
       → Format serialiser (CSV or JSON)
       → Response with Content-Disposition: attachment
       → Client receives file download
```

## Acceptance criteria

- [ ] **AC-1**: Given a valid JWT with `analytics:read` scope, when `GET /api/v1/analytics/export?format=csv&startDate=2026-01-01&endDate=2026-01-31` is called, then the response is 200 with `Content-Type: text/csv`, `Content-Disposition: attachment; filename="export.csv"`, and a CSV body with header row (`user_id,device_id,event_type,event_time`) followed by matching rows.
- [ ] **AC-2**: Given `format=json`, then the response is 200 with `Content-Type: application/json` and body `{ "data": [ { user_id, device_id, event_type, event_time }, … ] }`.
- [ ] **AC-3**: Given a missing or invalid JWT, then 401 is returned.
- [ ] **AC-4**: Given `format` is omitted or not `csv`/`json`, then 400 is returned with `{ error: { code: "INVALID_FORMAT", message: "…" } }`.
- [ ] **AC-5**: Given `startDate` or `endDate` is missing or not `YYYY-MM-DD`, then 400 is returned with `{ error: { code: "INVALID_DATE", message: "…" } }`.
- [ ] **AC-6**: Given the date range exceeds 90 days, then 400 is returned with `{ error: { code: "DATE_RANGE_TOO_LARGE", message: "…" } }`.
- [ ] **AC-7**: Given a DB error during query, then 500 is returned with the standard error envelope and no stack trace exposed.

## NFR checklist

- [ ] **Perf** — p95 latency < 500 ms for up to 90-day range (NFR-P2)
- [ ] **Security** — endpoint requires JWT Bearer `analytics:read` scope (NFR-S1, NFR-S2)
- [ ] **Security** — all query params validated and sanitised (NFR-S5)
- [ ] **Security** — parameterised SQL only (NFR-S8)
- [ ] **Security** — no PII in logs (NFR-S6)
- [ ] **Reliability** — graceful DB error → 500 with envelope (NFR-R3, NFR-R4)
- [ ] **Observability** — structured JSON log per request (NFR-O1)
- [ ] **Scalability** — stateless handler; no in-process state (NFR-SC1)
- [ ] **Scalability** — rate limiting enforced (NFR-SC2)

## Dependencies

- `src/db.js` connection pool
- Existing auth middleware (JWT + scope check)
- `analytics_events` table (no schema change needed)

## Open questions

- [x] Filename uses plain `export.csv` / `export.json` (no date range in filename) — confirmed.
- [x] `userId` filtering is single-value only — confirmed.

## Decision log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-02 | 90-day cap on date range | Protects DB; async jobs out of scope |
| 2026-06-02 | CSV + JSON only | Covers main use cases; Excel excluded to avoid extra deps |
| 2026-06-02 | Plain filename (export.csv) | Simpler; consumers can rename |
| 2026-06-02 | Single userId filter | Keeps query simple; multi-value out of scope |
