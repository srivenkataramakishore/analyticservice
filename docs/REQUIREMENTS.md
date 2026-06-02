# Requirements Specification — analyticservice

> **This is the standard and template for all requirements in this repository.**
>
> **Both Claude and GitHub Copilot must read this file before writing any design doc, spec, or code.**
> Every requirement lives in its own file under `docs/requirements/`. No feature, endpoint, or UI component may be implemented without a corresponding file there that is marked `Approved`.

---

## Requirements folder structure

Each requirement lives in its own Markdown file:

```
docs/
  REQUIREMENTS.md                          ← this file — standard & template only
  requirements/
    REQ-001-event-ingestion.md
    REQ-002-reports-api.md
    REQ-003-analytics-dashboard.md
    REQ-004-openapi-docs.md
    REQ-005-redshift-archival.md
    REQ-006-data-export.md
    REQ-<ID>-<short-title>.md              ← one file per requirement
```

**Rules:**
- One file per requirement — never combine multiple requirements in one file.
- File name format: `REQ-<zero-padded-ID>-<kebab-case-title>.md` (e.g. `REQ-007-purge-policy.md`).
- IDs are sequential and never reused, even if a requirement is cancelled.
- The file is the single source of truth — Jira tickets, PRs, and Confluence pages all link back to it.

---

## How to use this file

1. **Before any work starts** — create a new file in `docs/requirements/` using the template below.
2. **Fill in** the description, user stories, scope, data flow, acceptance criteria, and NFR checklist.
3. **Show the draft to the user for review** — do not save to the repo until confirmed.
4. **Save the file** with status `Draft` after confirmation.
5. **Get approval** — advance status to `Approved` before implementation begins.
6. **After merge** — update status to `Implemented` and add the PR link.
7. **Never implement** a requirement that is still `Draft` or `In Review`.

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

## Requirement file template

Copy this into a new file under `docs/requirements/` for every new requirement:

```markdown
# REQ-<ID>: <Short title>

| Field | Value |
|-------|-------|
| **ID** | REQ-<ID> |
| **Jira ticket** | [KN-<N>](https://srivenkatarama.atlassian.net/browse/KN-<N>) |
| **Type** | API \| UI \| Infrastructure \| Data |
| **Status** | Draft \| In Review \| Approved \| Implemented |
| **Author** | <name> |
| **Date** | YYYY-MM-DD |
| **Figma** | — (UI only) |
| **PR / Commit** | — |

## Description
<!-- What does this feature/change do? Who needs it and why? -->

## User stories
- As a **<role>**, I want <goal> so that <reason>.

## Scope
**In scope:**
- 

**Out of scope:**
- 

## Data flow
```
<!-- Describe how data moves through the system for this feature -->
```

## Acceptance criteria
<!-- Every AC must be testable. Format: Given / When / Then. -->
- [ ] **AC-1**: Given … when … then …
- [ ] **AC-2**: Given … when … then …

## NFR checklist
<!-- Tick every NFR that applies. Add specific targets in brackets. -->
<!-- See Global NFR Catalogue below for the full list of named NFRs. -->
- [ ] **Perf** — p95 latency < ___ ms under ___ concurrent users (NFR-P1 / NFR-P2)
- [ ] **Perf** — throughput ≥ ___ req/s sustained
- [ ] **Security** — all endpoints require authentication (Bearer JWT) (NFR-S1)
- [ ] **Security** — input validated and sanitised before DB/storage use (NFR-S5)
- [ ] **Security** — no PII logged in plain text (NFR-S6)
- [ ] **Security** — HTTPS enforced; HTTP rejected at gateway (NFR-S4)
- [ ] **Security** — parameterised SQL only (NFR-S8)
- [ ] **Reliability** — error rate < ___% over 24 h rolling window (NFR-R1)
- [ ] **Reliability** — graceful degradation when dependency unavailable (NFR-R2 / NFR-R3)
- [ ] **Reliability** — consistent error envelope (NFR-R4)
- [ ] **Observability** — structured JSON log per request (NFR-O1)
- [ ] **Observability** — health endpoint updated / verified (NFR-O2)
- [ ] **Scalability** — service remains stateless (NFR-SC1)
- [ ] **Scalability** — rate limiting enforced (NFR-SC2)
- [ ] **Accessibility** (UI only) — WCAG 2.1 AA (NFR-A1)
- [ ] **Accessibility** (UI only) — keyboard navigable (NFR-A2)
- [ ] **Compatibility** (UI only) — Chrome, Firefox, Safari latest 2 versions (NFR-C1)
- [ ] **Compatibility** (UI only) — responsive: mobile / tablet / desktop (NFR-C2)
- [ ] **Data** — parameterised SQL only; no string interpolation (NFR-S8)
- [ ] **Data** — DB migration script in `migrations/` (NFR-D2)
- [ ] **Data** — indexes on all WHERE / GROUP BY columns (NFR-D3)

## Dependencies
- 

## Open questions
- [ ] 

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| YYYY-MM-DD | | |
```

---

## Global NFR catalogue

These NFRs apply to **all** features unless explicitly exempted. Any exemption must be noted in the requirement file with a justification.

### Performance
| ID | NFR |
|----|-----|
| NFR-P1 | API ingestion endpoints (POST) must respond within **200 ms at p95** under normal load. |
| NFR-P2 | API query endpoints (GET) must respond within **500 ms at p95** for date ranges up to 90 days. |
| NFR-P3 | UI pages must achieve a **Largest Contentful Paint (LCP) ≤ 2.5 s** on a mid-tier device. |
| NFR-P4 | Bulk ingestion must support up to **100 events per request** in a single batched DB write. |

### Security
| ID | NFR |
|----|-----|
| NFR-S1 | All API endpoints (except `/health`) require a valid **JWT Bearer token**. |
| NFR-S2 | Tokens must carry explicit **scope claims** (`analytics:read`, `analytics:write`); missing scope returns 403. |
| NFR-S3 | All tokens are **short-lived (≤ 1 hour)**; refresh is handled by the auth service. |
| NFR-S4 | All traffic must use **HTTPS**; HTTP requests are rejected at the gateway. |
| NFR-S5 | The `metadata` field (JSONB) is sanitised: keys ≤ 50 chars, values ≤ 500 chars. |
| NFR-S6 | **PII** (emails, names) must never be stored in `user_id` — use pseudonymous identifiers only. |
| NFR-S7 | **No secrets or credentials** in source code, logs, or error responses. |
| NFR-S8 | **Parameterised SQL only** — no string interpolation in queries. |

### Reliability
| ID | NFR |
|----|-----|
| NFR-R1 | Error rate must be **< 0.1%** over any 24-hour rolling window in production. |
| NFR-R2 | Service must **degrade gracefully** when Redis is unavailable (rate limiting bypassed, not crashed). |
| NFR-R3 | Service must **degrade gracefully** when DB is unavailable (health returns 503, not unhandled error). |
| NFR-R4 | All error responses must use the **consistent envelope**: `{ error: { code: string, message: string } }`. |
| NFR-R5 | Rate limiting returns **429** with a `Retry-After` header (not a bare error). |

### Observability
| ID | NFR |
|----|-----|
| NFR-O1 | Every HTTP request must emit a **structured JSON log** containing: `request_id`, `method`, `path`, `status_code`, `latency_ms`, `timestamp`, `user_token_scope`. |
| NFR-O2 | `GET /api/v1/analytics/health` must probe the DB connection and return `{ status, db, uptime_seconds }`. |
| NFR-O3 | Health endpoint must be **unauthenticated** — suitable for load balancer probes. |
| NFR-O4 | Key metrics to instrument: p95/p99 latency, error rate by status code, events ingested per minute, rate-limit hits. |

### Scalability
| ID | NFR |
|----|-----|
| NFR-SC1 | The service must be **stateless** — all session/rate-limit state stored in Redis, not in-process. |
| NFR-SC2 | Rate limiting: **≤ 1,000 requests per minute per token**. |
| NFR-SC3 | DB connection pool size: **max 10 connections** per instance (configurable via env). |

### Accessibility (UI)
| ID | NFR |
|----|-----|
| NFR-A1 | All UI components must meet **WCAG 2.1 Level AA** contrast and interaction requirements. |
| NFR-A2 | All interactive elements must be **keyboard navigable** (Tab, Enter, Escape, Arrow keys). |
| NFR-A3 | All non-text elements must have descriptive **ARIA labels**. |
| NFR-A4 | Focus state must be **visually distinct** (not browser-default hidden). |

### Compatibility (UI)
| ID | NFR |
|----|-----|
| NFR-C1 | Must render correctly on **Chrome, Firefox, Safari** — latest 2 major versions. |
| NFR-C2 | Must be **responsive**: mobile ≥ 320 px, tablet ≥ 768 px, desktop ≥ 1280 px. |
| NFR-C3 | No UI-breaking layout at any viewport between 320 px and 2560 px. |

### Data integrity
| ID | NFR |
|----|-----|
| NFR-D1 | All DB writes that span multiple rows must use **transactions** (BEGIN / COMMIT / ROLLBACK). |
| NFR-D2 | Every schema change must be accompanied by a **migration script** in `migrations/`. |
| NFR-D3 | Indexes must be defined for all columns used in WHERE or GROUP BY clauses. |

---

## Requirement index

| ID | Title | Type | Status |
|----|-------|------|--------|
| [REQ-001](requirements/REQ-001-event-ingestion.md) | Event ingestion API | API | Implemented |
| [REQ-002](requirements/REQ-002-reports-api.md) | Analytics query / reports API | API | Implemented |
| [REQ-003](requirements/REQ-003-analytics-dashboard.md) | Analytics dashboard UI | UI | Approved |
| [REQ-004](requirements/REQ-004-openapi-docs.md) | OpenAPI / Swagger documentation | API | Draft |
| [REQ-005](requirements/REQ-005-redshift-archival.md) | Redshift data archival | Data | Draft |
| [REQ-006](requirements/REQ-006-data-export.md) | Data export functionality | API | Approved |
