# REQ-003: Analytics dashboard UI

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

## Description
Build a frontend analytics dashboard that consumes the KN-2 Data Service API to visualise event telemetry for internal teams. Provides real-time event monitoring, time-series trend charts, event-type breakdowns, and API health status.

## User stories
- As an **internal analyst**, I want a dashboard that shows event volume over time so that I can spot trends without writing SQL.
- As a **platform engineer**, I want an API health indicator in the nav so that I know the backend status at a glance.
- As a **product manager**, I want to filter by event type and date range so that I can measure specific features independently.

## Scope
**In scope:**
- Summary metric cards (total events, unique users, events/day, avg latency)
- Time-series line chart with group_by toggle (hour/day/week/month)
- Event type dropdown filter
- Date range picker with 7/30/90-day presets and custom range
- API health indicator (polling every 60 seconds)
- Recent events table (live, auto-refresh every 30 seconds)
- JWT auth with token expiry handling

**Out of scope:**
- User management or role-based access within the dashboard
- Exporting data to CSV/PDF
- Mobile-native app

## Data flow
```
Browser (JWT in memory)
  ↓  GET /api/v1/analytics/reports?...
  ↓  GET /api/v1/analytics/health (every 60s)
Data Service API (KN-2)
  ↓
Redshift: analytics_events
  ↓
Dashboard renders charts, metrics, table
```

## Acceptance criteria
- [ ] **AC-1**: Given the dashboard loads with a valid token, when data is fetched, then summary metric cards (total events, unique users, events/day, avg latency) are displayed and update when the date range filter changes.
- [ ] **AC-2**: Given the time-series chart section, when a `group_by` granularity is selected (hour/day/week/month), then the chart re-fetches from `GET /api/v1/analytics/reports` and re-renders.
- [ ] **AC-3**: Given the event type dropdown, when an event type is selected, then all charts and metric cards filter to that event type only.
- [ ] **AC-4**: Given the date range picker, when dates are selected, then the range is validated client-side (max 90 days) before any API call is made.
- [ ] **AC-5**: Given the user's JWT token has expired, when any API call is made, then the dashboard shows a clear error state with a re-login prompt.
- [ ] **AC-6**: Given the health indicator in the nav, it polls `GET /api/v1/analytics/health` every 60 seconds and shows green (ok) or red (degraded).
- [ ] **AC-7**: Given any API call fails, then the affected widget shows an inline error state — the rest of the dashboard remains usable.

## NFR checklist
- [ ] **Perf** — LCP ≤ 2.5 s on mid-tier device (NFR-P3)
- [ ] **Security** — JWT Bearer token with `analytics:read` scope sent with every API call (NFR-S1)
- [ ] **Security** — token stored in memory only — not in localStorage or cookies (NFR-S7)
- [ ] **Reliability** — each widget handles its own error state independently (NFR-R2)
- [ ] **Accessibility** — WCAG 2.1 AA; all charts have text alternatives / ARIA labels (NFR-A1, NFR-A3)
- [ ] **Accessibility** — fully keyboard navigable (NFR-A2)
- [ ] **Compatibility** — works on Chrome, Firefox, Safari latest 2 versions (NFR-C1)
- [ ] **Compatibility** — responsive at 320 px, 768 px, 1280 px breakpoints (NFR-C2)

## Dependencies
- KN-2 Data Service API (REQ-001, REQ-002) must be deployed
- Figma wireframe approved
- JWT token issuance flow available for the dashboard to consume

## Open questions
- [ ] What framework should the dashboard use — React, Vue, or plain HTML?
- [ ] Should the dashboard be a standalone app or embedded in an existing internal portal?

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Token stored in memory only | Prevents XSS token theft via localStorage |
| 2026-05-30 | Health polling every 60 s | Balances freshness with API load |
