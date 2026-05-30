# REQ-004: OpenAPI / Swagger documentation

| Field | Value |
|-------|-------|
| **ID** | REQ-004 |
| **Jira ticket** | [KN-2](https://srivenkatarama.atlassian.net/browse/KN-2) (AC-6) |
| **Type** | API |
| **Status** | Draft |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | — |

## Description
Publish an OpenAPI 3.1 spec (auto-generated from code annotations) accessible at `GET /api/v1/analytics/docs` via Swagger UI. Ensures the API is self-documenting and integration-ready for consumers without requiring manual documentation effort.

## User stories
- As an **API consumer**, I want a Swagger UI at `/docs` so that I can explore endpoints and test them without reading source code.
- As a **platform engineer**, I want the spec to be auto-generated from code annotations so that it stays in sync with the implementation automatically.

## Scope
**In scope:**
- OpenAPI 3.1 spec auto-generated via `swagger-jsdoc` or equivalent
- Swagger UI served at `GET /api/v1/analytics/docs`
- All endpoints documented: `/events`, `/reports`, `/health`
- Example request/response payloads per endpoint
- Auth requirements documented (Bearer token, scopes)
- Spec version tied to `package.json` version

**Out of scope:**
- API versioning via the spec (v1 only)
- Postman collection generation
- External API gateway publishing

## Acceptance criteria
- [ ] **AC-1**: `GET /api/v1/analytics/docs` returns a rendered Swagger UI page.
- [ ] **AC-2**: Every endpoint (`/events`, `/reports`, `/health`) is documented with all params, request body schema, and response schemas.
- [ ] **AC-3**: Example request and response payloads are included for each endpoint.
- [ ] **AC-4**: The spec correctly reflects current auth requirements (Bearer token, scopes).
- [ ] **AC-5**: The `info.version` field in the spec matches the `version` field in `package.json`.

## NFR checklist
- [ ] **Security** — Swagger UI accessible without auth (docs are intentionally public)
- [ ] **Observability** — spec version matches `package.json` version at all times
- [ ] **Data** — no secrets or internal hostnames exposed in the spec

## Dependencies
- REQ-001 and REQ-002 implemented (endpoints must exist before they can be documented)
- `swagger-jsdoc` and `swagger-ui-express` packages added to `package.json`

## Open questions
- [ ] Should the Swagger UI be protected behind auth in production (internal-only), or fully public?

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Auto-generate from JSDoc annotations | Keeps spec in sync with code; avoids manual drift |
