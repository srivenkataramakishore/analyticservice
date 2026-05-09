# GitHub Copilot Instructions

These instructions apply to all code suggestions and completions in the `analyticservice` repository. Follow them for every task.

---

## Language & Runtime
- **JavaScript (Node.js)** only. Do not suggest TypeScript unless explicitly asked.
- Use **ES2020+** syntax (async/await, optional chaining, nullish coalescing).
- Never use `.then()/.catch()` chains — always use `async/await`.

---

## Code Style
- **2 spaces** indentation, no tabs.
- **Single quotes** for all strings.
- **Semicolons** always.
- Max line length: **100 characters**.
- Follow **ESLint recommended** rules.

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables & functions | camelCase | `userId`, `validateDateRange()` |
| Constants | UPPER_SNAKE_CASE | `MAX_POOL_SIZE` |
| Files | kebab-case | `analytics-router.js` |
| Folders | kebab-case | `src/routes/` |

---

## Express & Routing
- Always wrap route handlers in `try/catch` and return proper HTTP error responses.
- Never expose raw error messages or stack traces in responses.
- Always validate and sanitize query params before use.
- Return consistent JSON error shape: `{ error: '<message>' }`.
- Return consistent JSON success shape: `{ <id>, startDate, endDate, count, data: [...] }`.

---

## Database
- Always use the connection pool from `src/db.js` — never create ad-hoc `pg` connections.
- **Always use parameterized queries** (`$1`, `$2`) — never interpolate variables into SQL strings.
- Default sort: `ORDER BY event_time DESC` on all event queries.
- Table: `analytics_events` — columns: `user_id`, `device_id`, `event_type`, `event_time`.

---

## Environment & Config
- All config via `process.env` — never hardcode secrets, passwords, or hostnames.
- Use `dotenv` for local development (`require('dotenv').config()` at entry point only).

---

## Testing
- Framework: **Jest** + **Supertest**.
- Always mock `src/db.js` using `jest.mock('../db')` — never hit a real database in tests.
- Test file location: `src/__tests__/<module>.test.js`.
- Every new function or endpoint must have tests for:
  - Happy path (200 with correct data)
  - Missing required params (400)
  - Invalid input format (400)
  - Database/server error (500)
- Naming: `describe('GET /analytics/<route>', () => { it('should ...') })`.
- Minimum **80% code coverage**.

---

## Branching
- Feature branches: `feature/<short-description>`
- Bug fix branches: `fix/<short-description>`
- Hotfix branches: `hotfix/<short-description>`
- Breaking changes / major versions: `ver<X.Y>` (e.g. `ver2.0`)
- Chore / maintenance: `chore/<short-description>`
- Never commit breaking changes directly to `main`.

---

## Commit Messages
Follow **Conventional Commits**:
```
<type>(<scope>): <short summary under 72 chars>
```
Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `breaking`.

Examples:
```
feat(analytics): add event-type filter to user endpoint
fix(db): handle null userId gracefully
breaking(analytics): restructure response payload for v2
```

---

## Breaking Changes
- Always use a versioned branch (e.g. `ver2.0`) for breaking changes.
- Create `BREAKING_CHANGES.md` at the root describing what changed and migration steps.
- Bump `package.json` version following **SemVer** (breaking = MAJOR bump).
- Never remove or rename existing query params without a major version bump.

---

## Design Documents
- Store all design docs in `docs/design/<YYYY-MM-DD>-<short-description>.md`.
- A design doc is required before implementing new endpoints, breaking changes, or schema changes.
- Follow the 12-section template defined in `.claude/CLAUDE.md`.

---

## Pull Requests
- PR titles follow Conventional Commits format.
- PR descriptions must include: Summary, Changes, Breaking Changes, How to Test, Related Issues.
- All PRs require at least one reviewer and must pass CI before merging.
- PRs with breaking changes must be labeled `breaking-change`.
