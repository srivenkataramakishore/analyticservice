# Design Doc: Data Export Endpoint

| Field | Value |
|-------|-------|
| **Date** | 2026-06-02 |
| **Author** | Kishore Chivukula |
| **Requirement** | [REQ-006](../requirements/REQ-006-data-export.md) |
| **Jira** | [KN-4](https://srivenkatarama.atlassian.net/browse/KN-4) |
| **Confluence** | https://srivenkatarama.atlassian.net/wiki/spaces/~59f7fb669f0d7810010f53c4/pages/14417922 |
| **Status** | Approved |

---

## Endpoint definition

```
GET /api/v1/analytics/export
```

### Authentication

Bearer JWT required. Token must carry scope claim `analytics:read`. Missing or invalid token → 401. Missing scope → 403.

### Query parameters

| Parameter | Required | Type | Validation |
|-----------|----------|------|------------|
| `format` | Yes | `csv` \| `json` | Enum; 400 INVALID_FORMAT if missing/other |
| `startDate` | Yes | `YYYY-MM-DD` | ISO date; 400 INVALID_DATE if missing/malformed |
| `endDate` | Yes | `YYYY-MM-DD` | ISO date; 400 INVALID_DATE if missing/malformed; must be ≥ startDate |
| `userId` | No | string | Passed as SQL param; no format constraint |
| `eventType` | No | string | Passed as SQL param; no format constraint |

Additional constraint: `endDate − startDate > 90 days` → 400 DATE_RANGE_TOO_LARGE.

---

## Response shape

### CSV (format=csv)

```
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="export.csv"

user_id,device_id,event_type,event_time
abc123,dev456,page_view,2026-01-15T10:23:00.000Z
...
```

### JSON (format=json)

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": [
    {
      "user_id": "abc123",
      "device_id": "dev456",
      "event_type": "page_view",
      "event_time": "2026-01-15T10:23:00.000Z"
    }
  ]
}
```

### Error envelope (all error cases)

```json
{
  "error": {
    "code": "INVALID_FORMAT",
    "message": "format must be \"csv\" or \"json\""
  }
}
```

---

## DB query

No schema changes. Uses existing `analytics_events` table.

```sql
-- Base query (no optional filters)
SELECT user_id, device_id, event_type, event_time
FROM analytics_events
WHERE event_time >= $1
  AND event_time <  $2
ORDER BY event_time DESC;

-- With userId
... AND user_id = $3

-- With eventType
... AND event_type = $3   -- or $4 if userId also present
```

Parameters are built dynamically; all values passed as positional parameters — no string interpolation.

---

## Implementation plan

### Files to create / modify

| File | Action |
|------|--------|
| `src/routes/analytics-router.js` | Add `GET /export` route |
| `src/export/export-service.js` | New — DB query + row serialisation |
| `src/export/export-validator.js` | New — input validation helpers |
| `src/__tests__/export.test.js` | New — Jest + Supertest tests |

### Validation logic (export-validator.js)

1. Check `format` ∈ `['csv', 'json']` → 400 INVALID_FORMAT
2. Check `startDate` and `endDate` match `/^\d{4}-\d{2}-\d{2}$/` and are valid dates → 400 INVALID_DATE
3. Check `(endDate − startDate) ≤ 90 days` → 400 DATE_RANGE_TOO_LARGE

### Serialisation logic (export-service.js)

- **CSV**: build header row `user_id,device_id,event_type,event_time` then one row per result. Use simple comma join — none of the column values contain commas or quotes.
- **JSON**: wrap rows in `{ data: rows }`.

### Route handler (analytics-router.js)

1. Call `validateExportParams(req.query)` — throws structured error on invalid input.
2. Call `exportService.queryEvents(params)` — returns row array.
3. Call `exportService.serialise(rows, format)` — returns string.
4. Set headers and send response.
5. Catch all errors — DB errors → 500; validation errors → 400.

---

## Error codes

| HTTP | Code | Trigger |
|------|------|---------|
| 400 | `INVALID_FORMAT` | `format` missing or not csv/json |
| 400 | `INVALID_DATE` | `startDate`/`endDate` missing or malformed |
| 400 | `DATE_RANGE_TOO_LARGE` | Range > 90 days |
| 401 | — | JWT missing or invalid (handled by auth middleware) |
| 403 | — | Scope missing (handled by auth middleware) |
| 500 | `EXPORT_FAILED` | Unexpected DB or serialisation error |

---

## Test plan

| Test | AC |
|------|----|  
| Returns 200 + CSV for valid request | AC-1 |
| Returns 200 + JSON for format=json | AC-2 |
| Applies userId filter correctly | AC-1 |
| Applies eventType filter correctly | AC-1 |
| Returns 401 for missing JWT | AC-3 |
| Returns 400 INVALID_FORMAT for bad format | AC-4 |
| Returns 400 INVALID_DATE for missing/bad date | AC-5 |
| Returns 400 DATE_RANGE_TOO_LARGE for range > 90d | AC-6 |
| Returns 500 on DB error | AC-7 |
