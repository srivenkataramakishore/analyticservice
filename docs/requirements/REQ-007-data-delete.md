# REQ-007: Data Delete Functionality

| Field | Value |
|-------|-------|
| **ID** | REQ-007 |
| **Jira ticket** | [KN-5](https://srivenkatarama.atlassian.net/browse/KN-5) |
| **Type** | API + UI |
| **Status** | Approved |
| **Author** | Kishore Chivukula |
| **Date** | 2026-06-03 |
| **Figma** | — |
| **Confluence** | https://srivenkatarama.atlassian.net/wiki/spaces/~59f7fb669f0d7810010f53c4/pages/14647298 |
| **PR / Commit** | — |

## Description
Allow authorised users to permanently delete analytics events from `analytics_events`. Deletion can target all events for a specific **user** or a specific **device**, within an optional date range. A corresponding UI Delete panel on the analytics dashboard exposes this action to dashboard users.

## User stories
- As an **analytics admin**, I want to delete all events for a given user so that I can honour GDPR right-to-erasure requests.
- As an **analytics admin**, I want to delete all events for a given device so that I can purge test or erroneous device data.
- As an **analytics admin**, I want to optionally scope deletion to a date range to avoid accidentally removing more data than intended.
- As a **dashboard user**, I want a Delete panel in the UI so that I can trigger deletions without using the API directly.

## Scope
**In scope:**
- `DELETE /api/v1/analytics/user` — delete events by `userId`, optional `startDate`/`endDate`
- `DELETE /api/v1/analytics/device` — delete events by `deviceId`, optional `startDate`/`endDate`
- Response body: `{ deleted: <count> }`
- UI `DeletePanel` component (React) with userId/deviceId input, optional date pickers, confirmation dialog, and success/error feedback
- Storybook stories for all UI states
- Jest + Supertest tests (happy path, missing params, invalid dates, DB errors)

**Out of scope:**
- Bulk deletion by event type alone
- Soft-delete / archival (hard delete only)
- Audit log / deletion history
- Auth service changes

## Data flow
```
Client → DELETE /api/v1/analytics/user?userId=X[&startDate=Y&endDate=Z]
  → JWT middleware (analytics:write scope required)
  → Input validation (userId present, dates valid if provided)
  → Parameterised DELETE query on analytics_events
  → Return { deleted: N }
```

## Acceptance criteria
- [ ] **AC-1**: Given a valid JWT with `analytics:write` scope and a known `userId`, when `DELETE /api/v1/analytics/user?userId=X` is called, then all events for that user are deleted and the response is `200 { deleted: N }`.
- [ ] **AC-2**: Given a valid JWT, a `userId`, and a valid date range, when the endpoint is called, then only events within that range are deleted.
- [ ] **AC-3**: Given a missing `userId`, when the endpoint is called, then `400 { error: { code: 'MISSING_PARAM', message: '...' } }` is returned and nothing is deleted.
- [ ] **AC-4**: Given an invalid date format, when the endpoint is called, then `400` is returned and nothing is deleted.
- [ ] **AC-5**: Given no JWT or a JWT without `analytics:write` scope, when the endpoint is called, then `401`/`403` is returned.
- [ ] **AC-6**: Given a DB error, when the endpoint is called, then `500 { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } }` is returned.
- [ ] **AC-7**: AC-1–AC-6 apply symmetrically to `DELETE /api/v1/analytics/device?deviceId=X`.
- [ ] **AC-8**: Given the Delete panel, when the user fills in a userId/deviceId and clicks Delete, a confirmation dialog appears before any request is made.
- [ ] **AC-9**: Given confirmation is accepted and the request succeeds, then the panel shows "X events deleted" and clears the form.
- [ ] **AC-10**: Given confirmation is accepted and the request fails, then the panel shows the error message from the API.

## NFR checklist
- [x] **NFR-S1** — all delete endpoints require JWT Bearer token
- [x] **NFR-S2** — `analytics:write` scope required; missing scope → 403
- [x] **NFR-S8** — parameterised SQL only
- [x] **NFR-P1** — p95 latency < 200 ms for single-user/device deletes
- [x] **NFR-R4** — consistent error envelope `{ error: { code, message } }`
- [x] **NFR-O1** — structured JSON log per request
- [x] **NFR-A1** — UI: WCAG 2.1 AA
- [x] **NFR-A2** — UI: keyboard navigable
- [x] **NFR-A3** — UI: ARIA labels on all interactive elements
- [x] **NFR-C1** — UI: Chrome/Firefox/Safari latest 2 versions
- [x] **NFR-C2** — UI: responsive (mobile/tablet/desktop)

## Dependencies
- Existing JWT middleware (on `GET` routes)
- `src/db.js` connection pool
- Analytics dashboard UI (REQ-003)

## Open questions
- [x] Return `200 { deleted: 0 }` for no-match rows — decided: yes, 200 is correct (successful no-op)

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-03 | Return `200 { deleted: 0 }` when no rows match | DELETE on valid resource with 0 matches is a successful no-op, not 404 |
