# Design Doc: Data Delete API + UI

| Field | Value |
|-------|-------|
| **Requirement** | [REQ-007](../requirements/REQ-007-data-delete.md) |
| **Jira** | [KN-5](https://srivenkatarama.atlassian.net/browse/KN-5) |
| **Status** | Approved |
| **Date** | 2026-06-03 |
| **Confluence** | https://srivenkatarama.atlassian.net/wiki/spaces/~59f7fb669f0d7810010f53c4/pages/14647298 |

---

## 1. Endpoints

### DELETE /api/v1/analytics/user

**Auth**: Bearer JWT, scope `analytics:write` required.

**Query parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | Target user identifier |
| `startDate` | string (YYYY-MM-DD) | No | Range start (inclusive) |
| `endDate` | string (YYYY-MM-DD) | No | Range end (inclusive) |

**Response — success**:
```json
{ "deleted": 42 }
```

**Response — validation error**:
```json
{ "error": { "code": "MISSING_PARAM", "message": "userId is required" } }
```

**Response — auth error**: `401` / `403`

**Response — server error**:
```json
{ "error": { "code": "INTERNAL_ERROR", "message": "Internal server error" } }
```

---

### DELETE /api/v1/analytics/device

Identical contract to `/user`, substituting `deviceId` for `userId`.

---

## 2. SQL Queries

### Delete by userId (no date range)
```sql
DELETE FROM analytics_events
WHERE user_id = $1;
```

### Delete by userId (with date range)
```sql
DELETE FROM analytics_events
WHERE user_id = $1
  AND event_time >= $2::date
  AND event_time < ($3::date + INTERVAL '1 day');
```

### Delete by deviceId (no date range)
```sql
DELETE FROM analytics_events
WHERE device_id = $1;
```

### Delete by deviceId (with date range)
```sql
DELETE FROM analytics_events
WHERE device_id = $1
  AND event_time >= $2::date
  AND event_time < ($3::date + INTERVAL '1 day');
```

All queries use `pool.query()` from `src/db.js`. Row count is read from `result.rowCount`.

---

## 3. Validation Logic

- `userId` / `deviceId`: must be present (non-empty string); otherwise 400.
- `startDate` / `endDate`: both optional, but if either is provided both must be provided, must match `YYYY-MM-DD`, and `startDate <= endDate`.
- Auth: JWT Bearer required; scope `analytics:write` required (403 if absent). Note: JWT middleware is a TODO in this codebase — the routes currently have no auth middleware. A `TODO(KN-5): add JWT middleware` comment is added; the scope check will be enforced when middleware is wired.

---

## 4. UI Component: DeletePanel

**File**: `src/components/DeletePanel/DeletePanel.jsx`

**Props**:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiBase` | string | `''` | Base URL for API calls (e.g. `/api/v1/analytics`) |

**Internal state**:
- `target`: `'user'` | `'device'`
- `id`: string (userId or deviceId value)
- `startDate`: string
- `endDate`: string
- `confirming`: boolean — controls confirmation dialog visibility
- `status`: `null` | `{ type: 'success', deleted: number }` | `{ type: 'error', message: string }`
- `loading`: boolean

**Visual states** (matching Storybook stories):
- Default — empty form, target = user
- Confirming — confirmation dialog overlay visible
- Loading — spinner, form disabled
- Success — "42 events deleted" banner, form cleared
- Error — error message banner
- DeviceTarget — same as Default but target = device

**Accessibility**:
- Confirmation dialog uses `role="dialog"` and `aria-modal="true"`
- Inputs have `aria-label` and associated `<label>` elements
- All interactive elements reachable via keyboard (Tab, Enter, Escape to dismiss dialog)
- Focus trapped inside dialog when open

---

## 5. Storybook Stories

`src/components/DeletePanel/DeletePanel.stories.jsx` — stories: Default, DeviceTarget, Confirming, Loading, Success, Error.

---

## 6. Test Coverage

`src/__tests__/analytics-delete.test.js` covers:
- DELETE /analytics/user: happy path, date-range, missing userId, invalid date, DB error
- DELETE /analytics/device: happy path, missing deviceId, DB error

Minimum 80% coverage on new lines.
