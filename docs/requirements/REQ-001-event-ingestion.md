# REQ-001: Event ingestion API

| Field | Value |
|-------|-------|
| **ID** | REQ-001 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) |
| **Type** | API |
| **Status** | Implemented |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | [PR #3](https://github.com/srivenkataramakishore/analyticservice/pull/3) |

## Description
Provide a `POST /api/v1/analytics/events` endpoint that ingests single or bulk (≤ 100) analytics events into the `analytics_events` table. Required to support product telemetry collection.

## User stories
- As a **product engineer**, I want to post analytics events from the application so that user behaviour is captured for reporting.
- As a **platform engineer**, I want bulk ingestion support so that high-throughput clients can send events efficiently without many round trips.

## Scope
**In scope:**
- Single event ingestion via JSON body
- Bulk ingestion of up to 100 events per request
- Input validation for `event_type`, `timestamp`, `user_id`
- `metadata` field sanitisation (keys ≤ 50 chars, values ≤ 500 chars)
- JWT Bearer auth with `analytics:write` scope enforcement
- Rate limiting (1,000 req/min per token)

**Out of scope:**
- Streaming / WebSocket ingestion
- Cross-tenant event isolation

## Data flow
```
Client
  ↓  POST /api/v1/analytics/events
Auth middleware (JWT, analytics:write scope)
  ↓
Validation + metadata sanitisation
  ↓
Batched INSERT INTO analytics_events (transaction)
  ↓
Redshift: analytics_events
```

## Acceptance criteria
- [x] **AC-1**: Given a valid `analytics:write` token, when `POST /api/v1/analytics/events` is called with a valid single event payload, then the API returns `201 Created` with the `event_id` and `created_at`.
- [x] **AC-2**: Given a valid token, when an array of up to 100 events is posted, then all events are inserted in a single transaction and the API returns `201` with an array of inserted IDs.
- [x] **AC-3**: Given a payload with a missing `event_type`, `timestamp`, or `user_id`, then the API returns `400` with `{ error: { code: "INVALID_PAYLOAD", message: "..." } }`.
- [x] **AC-4**: Given an array of more than 100 events, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-5**: Given no `Authorization` header, then the API returns `401 UNAUTHORIZED`.
- [x] **AC-6**: Given a token with `analytics:read` scope (not write), then the API returns `403 FORBIDDEN`.

## NFR checklist
- [x] **Perf** — p95 latency < 200 ms under normal load (NFR-P1)
- [x] **Perf** — bulk: up to 100 events per request in a single batched INSERT (NFR-P4)
- [x] **Security** — requires JWT Bearer token with `analytics:write` scope (NFR-S1, NFR-S2)
- [x] **Security** — `metadata` field sanitised: keys ≤ 50 chars, values ≤ 500 chars (NFR-S5)
- [x] **Security** — parameterised SQL only (NFR-S8)
- [x] **Reliability** — consistent error envelope (NFR-R4)
- [x] **Reliability** — rate limiting with Retry-After header (NFR-R5)
- [x] **Observability** — structured JSON log per request (NFR-O1)
- [x] **Data** — multi-row insert wrapped in transaction (NFR-D1)
- [x] **Data** — migration script included (NFR-D2)

## Dependencies
- `src/db.js` connection pool
- Redis for rate limiting
- JWT auth service for token issuance

## Open questions
- None — requirement fully implemented.

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Bulk limit set to 100 events | Balances throughput with DB transaction size; revisit at scale |
| 2026-05-30 | Metadata sanitised in app layer | Prevent oversized JSONB payloads degrading DB performance |
