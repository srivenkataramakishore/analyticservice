# Design Document: Fetch Analytics by Event Type

**Date**: 2026-05-09
**Author**: srivenkataramakishore
**Branch**: `feature/analytics-by-event-type`
**Version**: 1.1.0
**Status**: Implemented

---

## 1. Overview
Add a new GET endpoint `/analytics/event` that allows consumers to query `analytics_events` filtered by `event_type` and a date range. This is a backward-compatible addition to the existing analytics service.

---

## 2. Problem Statement
Currently the service supports querying events by `user_id` and `device_id`. There is no way to query across all events of a specific type (e.g. all `click` events, all `pageview` events) within a date range, making it hard to do event-level trend analysis.

---

## 3. Goals
- Add a new endpoint `GET /analytics/event` filtered by `event_type` and date range.
- Return aggregated count per day alongside raw event rows.
- Reuse existing validation and error handling patterns.
- Maintain 80%+ test coverage.

---

## 4. Non-Goals
- No changes to existing `/analytics/user` or `/analytics/device` endpoints.
- No pagination in this version (can be added later).
- No new database tables or schema changes.

---

## 5. Proposed Solution

### 5.1 API Changes
| Method | Endpoint | Change | Notes |
|--------|----------|--------|-------|
| GET | `/analytics/event` | New | Filter by `event_type` + date range |

### 5.2 Request & Response

**Request:**
```
GET /analytics/event?eventType=click&startDate=2026-04-01&endDate=2026-04-30
```

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `eventType` | string | Yes | The event type to filter by (e.g. `click`, `pageview`) |
| `startDate` | string | Yes | Start date in `YYYY-MM-DD` format |
| `endDate` | string | Yes | End date in `YYYY-MM-DD` format |

**Success Response (200):**
```json
{
  "eventType": "click",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "count": 3,
  "dailySummary": [
    { "date": "2026-04-10", "count": 2 },
    { "date": "2026-04-15", "count": 1 }
  ],
  "data": [
    { "user_id": "123", "device_id": "abc", "event_type": "click", "event_time": "2026-04-10T10:00:00Z" },
    { "user_id": "456", "device_id": "xyz", "event_type": "click", "event_time": "2026-04-10T09:00:00Z" },
    { "user_id": "789", "device_id": "def", "event_type": "click", "event_time": "2026-04-15T14:00:00Z" }
  ]
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| 400 | `eventType` missing |
| 400 | `startDate` or `endDate` missing or invalid format |
| 400 | `startDate` is after `endDate` |
| 500 | Database error |

### 5.3 Database Changes
No schema changes. Two parallel queries against the existing `analytics_events` table run via `Promise.all()`:
1. Aggregate query — daily count grouped by `DATE(event_time)`.
2. Detail query — raw rows ordered by `event_time DESC`.

### 5.4 Architecture Changes
None. Follows the same Express router pattern as `src/routes/analytics.js`.

---

## 6. Breaking Changes
None. This is a new endpoint with no impact on existing endpoints.

---

## 7. Migration Plan
N/A — no breaking changes.

---

## 8. Testing Plan
- Unit tests with mocked DB for all happy path and error scenarios.
- Tests for: missing `eventType`, missing dates, invalid date format, start > end, DB error, valid request, empty results.

---

## 9. Rollout Plan
- Feature branch `feature/analytics-by-event-type` → PR → review → merge to `main`.
- No feature flag needed (new endpoint, no risk to existing endpoints).

---

## 10. Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large result sets for popular event types | Medium | Add pagination in a follow-up (v1.2.0) |
| Slow aggregate query on large tables | Low | Redshift columnar storage handles aggregations efficiently |

---

## 11. Open Questions
- Should `eventType` matching be case-sensitive? (Assuming yes — matches DB values exactly.)
- Should we support multiple event types in one call? (Out of scope for now.)

---

## 12. References
- Existing route: `src/routes/analytics.js`
- DB pool: `src/db.js`
- Performance design: `API_PERFORMANCE_DESIGN.md`
