# Requirements Specification — analyticservice

> **This is the single source of truth for all functional requirements, acceptance criteria, and non-functional requirements (NFRs) in this repository.**
>
> **Both Claude and GitHub Copilot must read this file before writing any design doc, spec, or code.**
> No feature, endpoint, or UI component may be implemented without a corresponding entry here that is marked `Approved`.

---

## How to use this file

1. **Before any work starts** — add a new entry under the relevant section below.
2. **Fill in** the functional requirement, acceptance criteria (AC), and applicable NFRs.
3. **Get approval** — mark status `Approved` before implementation begins.
4. **After merge** — mark status `Implemented` and add the PR/commit link.
5. **Never implement** a requirement that is still `Draft` or `In Review`.

---

## Requirement status lifecycle

```
Draft → In Review → Approved → Implemented
```

| Status | Meaning |
|--------|---------|
| `Draft` | Being written — not ready for review |
| `In Review` | Shared with stakeholder for feedback |
| `Approved` | Signed off — safe to implement |
| `Implemented` | Merged to main, linked to PR |

---

## Requirement entry template

Copy this block for every new requirement:

```markdown
### REQ-<ID>: <Short title>

| Field | Value |
|-------|-------|
| **ID** | REQ-<ID> |
| **Jira ticket** | [KN-<N>](https://srivenkatarama.atlassian.net/browse/KN-<N>) |
| **Type** | API \| UI \| Infrastructure \| Data |
| **Status** | Draft \| In Review \| Approved \| Implemented |
| **Author** | <name> |
| **Date** | YYYY-MM-DD |
| **PR / Commit** | — |

#### Description
<!-- What does this feature/change do? Who needs it and why? -->

#### Acceptance criteria
<!-- Every AC must be testable. Format: Given / When / Then. -->
- [ ] **AC-1**: Given … when … then …
- [ ] **AC-2**: Given … when … then …

#### NFR checklist
<!-- Tick every NFR that applies. Add specific targets in brackets. -->
- [ ] **Perf** — p95 latency < ___ ms under ___ concurrent users
- [ ] **Perf** — throughput ≥ ___ req/s sustained
- [ ] **Security** — all endpoints require authentication (Bearer JWT)
- [ ] **Security** — input validated and sanitised before DB/storage use
- [ ] **Security** — no PII logged in plain text
- [ ] **Security** — HTTPS enforced; HTTP rejected at gateway
- [ ] **Reliability** — error rate < ___% over 24 h rolling window
- [ ] **Reliability** — graceful degradation when dependency (Redis / DB) is unavailable
- [ ] **Reliability** — all errors return consistent `{ error: { code, message } }` envelope
- [ ] **Observability** — structured JSON log emitted per request (request_id, latency_ms, status_code)
- [ ] **Observability** — health endpoint updated / verified
- [ ] **Scalability** — service remains stateless; scales horizontally
- [ ] **Scalability** — rate limiting enforced (≤ 1,000 req/min per token)
- [ ] **Accessibility** (UI only) — WCAG 2.1 AA; keyboard navigable; ARIA labels
- [ ] **Compatibility** (UI only) — works on Chrome, Firefox, Safari (latest 2 versions)
- [ ] **Compatibility** (UI only) — responsive: mobile (≥320px), tablet (≥768px), desktop (≥1280px)
- [ ] **Data** — parameterised SQL only; no string interpolation in queries
- [ ] **Data** — DB migration script included in `migrations/`
```

---

## Global NFR catalogue

These NFRs apply to **all** features unless explicitly exempted. Any exemption must be noted in the requirement entry with a justification.

### Performance
| NFR-P1 | API ingestion endpoints (POST) must respond within **200 ms at p95** under normal load. |
|--------|---|
| NFR-P2 | API query endpoints (GET) must respond within **500 ms at p95** for date ranges up to 90 days. |
| NFR-P3 | UI pages must achieve a **Largest Contentful Paint (LCP) ≤ 2.5 s** on a mid-tier device. |
| NFR-P4 | Bulk ingestion must support up to **100 events per request** in a single batched DB write. |

### Security
| NFR-S1 | All API endpoints (except `/health`) require a valid **JWT Bearer token**. |
|--------|---|
| NFR-S2 | Tokens must carry explicit **scope claims** (`analytics:read`, `analytics:write`); missing scope returns 403. |
| NFR-S3 | All tokens are **short-lived (≤ 1 hour)**; refresh is handled by the auth service. |
| NFR-S4 | All traffic must use **HTTPS**; HTTP requests are rejected at the gateway. |
| NFR-S5 | The `metadata` field (JSONB) is sanitised: keys ≤ 50 chars, values ≤ 500 chars. |
| NFR-S6 | **PII** (emails, names) must never be stored in `user_id` — use pseudonymous identifiers only. |
| NFR-S7 | **No secrets or credentials** in source code, logs, or error responses. |
| NFR-S8 | **Parameterised SQL only** — no string interpolation in queries. |

### Reliability
| NFR-R1 | Error rate must be **< 0.1%** over any 24-hour rolling window in production. |
|--------|---|
| NFR-R2 | Service must **degrade gracefully** when Redis is unavailable (rate limiting bypassed, not crashed). |
| NFR-R3 | Service must **degrade gracefully** when DB is unavailable (health returns 503, not unhandled error). |
| NFR-R4 | All error responses must use the **consistent envelope**: `{ error: { code: string, message: string } }`. |
| NFR-R5 | Rate limiting returns **429** with a `Retry-After` header (not a bare error). |

### Observability
| NFR-O1 | Every HTTP request must emit a **structured JSON log** containing: `request_id`, `method`, `path`, `status_code`, `latency_ms`, `timestamp`, `user_token_scope`. |
|--------|---|
| NFR-O2 | `GET /api/v1/analytics/health` must probe the DB connection and return `{ status, db, uptime_seconds }`. |
| NFR-O3 | Health endpoint must be **unauthenticated** — suitable for load balancer probes. |
| NFR-O4 | Key metrics to instrument: p95/p99 latency, error rate by status code, events ingested per minute, rate-limit hits. |

### Scalability
| NFR-SC1 | The service must be **stateless** — all session/rate-limit state stored in Redis, not in-process. |
|---------|---|
| NFR-SC2 | Rate limiting: **≤ 1,000 requests per minute per token**. |
| NFR-SC3 | DB connection pool size: **max 10 connections** per instance (configurable via env). |

### Accessibility (UI)
| NFR-A1 | All UI components must meet **WCAG 2.1 Level AA** contrast and interaction requirements. |
|--------|---|
| NFR-A2 | All interactive elements must be **keyboard navigable** (Tab, Enter, Escape, Arrow keys). |
| NFR-A3 | All non-text elements must have descriptive **ARIA labels**. |
| NFR-A4 | Focus state must be **visually distinct** (not browser-default hidden). |

### Compatibility (UI)
| NFR-C1 | Must render correctly on **Chrome, Firefox, Safari** — latest 2 major versions. |
|--------|---|
| NFR-C2 | Must be **responsive**: mobile ≥ 320 px, tablet ≥ 768 px, desktop ≥ 1280 px. |
| NFR-C3 | No UI-breaking layout at any viewport between 320 px and 2560 px. |

### Data integrity
| NFR-D1 | All DB writes that span multiple rows must use **transactions** (BEGIN / COMMIT / ROLLBACK). |
|--------|---|
| NFR-D2 | Every schema change must be accompanied by a **migration script** in `migrations/`. |
| NFR-D3 | Indexes must be defined for all columns used in WHERE or GROUP BY clauses. |

---

## Implemented requirements

### REQ-001: Event ingestion API

| Field | Value |
|-------|-------|
| **ID** | REQ-001 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) |
| **Type** | API |
| **Status** | Implemented |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | [PR #3](https://github.com/srivenkataramakishore/analyticservice/pull/3) |

#### Description
Provide a `POST /api/v1/analytics/events` endpoint that ingests single or bulk (≤ 100) analytics events into the `analytics_events` table. Required to support product telemetry collection.

#### Acceptance criteria
- [x] **AC-1**: Given a valid `analytics:write` token, when `POST /api/v1/analytics/events` is called with a valid single event payload, then the API returns `201 Created` with the `event_id` and `created_at`.
- [x] **AC-2**: Given a valid token, when an array of up to 100 events is posted, then all events are inserted in a single transaction and the API returns `201` with an array of inserted IDs.
- [x] **AC-3**: Given a payload with a missing `event_type`, `timestamp`, or `user_id`, then the API returns `400` with `{ error: { code: "INVALID_PAYLOAD", message: "..." } }`.
- [x] **AC-4**: Given an array of more than 100 events, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-5**: Given no `Authorization` header, then the API returns `401 UNAUTHORIZED`.
- [x] **AC-6**: Given a token with `analytics:read` scope (not write), then the API returns `403 FORBIDDEN`.

#### NFR checklist
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

---

### REQ-002: Analytics query / reports API

| Field | Value |
|-------|-------|
| **ID** | REQ-002 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) |
| **Type** | API |
| **Status** | Implemented |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | [PR #3](https://github.com/srivenkataramakishore/analyticservice/pull/3) |

#### Description
Provide a `GET /api/v1/analytics/reports` endpoint that returns aggregated, paginated event data with flexible time-series grouping and filtering by event type.

#### Acceptance criteria
- [x] **AC-1**: Given valid params `start_date`, `end_date`, `group_by=day`, when called with `analytics:read` token, then the API returns `200` with `{ data: [...], pagination: { total, page, page_size, has_next } }`.
- [x] **AC-2**: Given `group_by` set to `hour`, `day`, `week`, or `month`, then results are correctly bucketed.
- [x] **AC-3**: Given `event_type` filter param, then only events of that type are included in results.
- [x] **AC-4**: Given a date range exceeding 90 days, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-5**: Given `start_date` after `end_date`, then the API returns `400 INVALID_PAYLOAD`.
- [x] **AC-6**: Given no token, then `401`; wrong scope, then `403`.

#### NFR checklist
- [x] **Perf** — p95 latency < 500 ms for 90-day date ranges (NFR-P2)
- [x] **Security** — requires `analytics:read` scope (NFR-S1, NFR-S2)
- [x] **Security** — parameterised SQL only (NFR-S8)
- [x] **Reliability** — consistent error envelope (NFR-R4)
- [x] **Observability** — structured JSON log per request (NFR-O1)
- [x] **Data** — indexes on `event_type`, `timestamp`, `user_id` (NFR-D3)

---

### REQ-003: Analytics dashboard UI

| Field | Value |
|-------|-------|
| **ID** | REQ-003 |
| **Jira ticket** | [KN-3](https://srivenkatarama.atlassian.net/browse/KN-3) |
| **Type** | UI |
| **Status** | Approved |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **Figma** | [KN-3 — Analytics Dashboard Wireframe](https://www.figma.com/design/fMqUVZNPMYvC87jrQ6xlEh) |
| **PR / Commit** | — (not yet implemented) |

#### Description
Build a frontend analytics dashboard that consumes the KN-2 Data Service API to visualise event telemetry for internal teams. Provides real-time event monitoring, time-series trend charts, event-type breakdowns, and API health status.

#### Acceptance criteria
- [ ] **AC-1**: Given the dashboard loads with a valid token, when data is fetched, then summary metric cards (total events, unique users, events/day, avg latency) are displayed and update when the date range filter changes.
- [ ] **AC-2**: Given the time-series chart section, when a `group_by` granularity is selected (hour/day/week/month), then the chart re-fetches from `GET /api/v1/analytics/reports` and re-renders.
- [ ] **AC-3**: Given the event type dropdown, when an event type is selected, then all charts and metric cards filter to that event type only.
- [ ] **AC-4**: Given the date range picker, when dates are selected, then the range is validated client-side (max 90 days) before any API call is made.
- [ ] **AC-5**: Given the user's JWT token has expired, when any API call is made, then the dashboard shows a clear error state with a re-login prompt.
- [ ] **AC-6**: Given the health indicator in the nav, it polls `GET /api/v1/analytics/health` every 60 seconds and shows green (ok) or red (degraded).
- [ ] **AC-7**: Given any API call fails, then the affected widget shows an inline error state — the rest of the dashboard remains usable.

#### NFR checklist
- [ ] **Perf** — LCP ≤ 2.5 s on mid-tier device (NFR-P3)
- [ ] **Security** — JWT Bearer token with `analytics:read` scope sent with every API call (NFR-S1)
- [ ] **Security** — token stored in memory only — not in localStorage or cookies (NFR-S7)
- [ ] **Reliability** — each widget handles its own error state independently (NFR-R2)
- [ ] **Accessibility** — WCAG 2.1 AA; all charts have text alternatives / ARIA labels (NFR-A1, NFR-A3)
- [ ] **Accessibility** — fully keyboard navigable (NFR-A2)
- [ ] **Compatibility** — works on Chrome, Firefox, Safari latest 2 versions (NFR-C1)
- [ ] **Compatibility** — responsive at 320 px, 768 px, 1280 px breakpoints (NFR-C2)

---

## Open / upcoming requirements

> Add new requirements here as `Draft` and progress them through the lifecycle.

### REQ-004: OpenAPI / Swagger documentation

| Field | Value |
|-------|-------|
| **ID** | REQ-004 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) (AC-6) |
| **Type** | API |
| **Status** | Draft |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |

#### Description
Publish an OpenAPI 3.1 spec (auto-generated from code annotations) accessible at `GET /api/v1/analytics/docs` via Swagger UI.

#### Acceptance criteria
- [ ] **AC-1**: `GET /api/v1/analytics/docs` returns a rendered Swagger UI page.
- [ ] **AC-2**: Every endpoint (`/events`, `/reports`, `/health`) is documented with all params, request body schema, and response schemas.
- [ ] **AC-3**: Example request and response payloads are included for each endpoint.
- [ ] **AC-4**: The spec correctly reflects current auth requirements (Bearer token, scopes).

#### NFR checklist
- [ ] **Security** — Swagger UI accessible without auth (docs are public)
- [ ] **Observability** — spec version matches `package.json` version
