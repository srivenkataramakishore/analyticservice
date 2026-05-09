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
| UI Components | PascalCase | `AnalyticsChart.jsx` |
| UI Props | camelCase | `eventType`, `onDateChange` |

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
- Framework: **Jest** + **Supertest** for API; **Jest** + **React Testing Library** for UI.
- Always mock `src/db.js` using `jest.mock('../db')` — never hit a real database in tests.
- Test file location: `src/__tests__/<module>.test.js` for API; `src/components/<Name>/<Name>.test.jsx` for UI.
- Every new API endpoint must have tests for:
  - Happy path (200 with correct data)
  - Missing required params (400)
  - Invalid input format (400)
  - Database/server error (500)
- Every new UI component must have tests for:
  - Renders correctly with default props
  - Renders all visual states (loading, empty, error)
  - Handles user interactions correctly
- Naming: `describe('GET /analytics/<route>', () => { it('should ...') })` for API.
- Naming: `describe('<ComponentName>', () => { it('should render ...') })` for UI.
- Minimum **80% code coverage**.

---

## Spec-Driven Development (SDD)

This project follows Spec-Driven Development. **Never write code before a spec exists and is approved.**

### API SDD
- API design doc must exist in `docs/design/` before any route code is written.
- Design doc defines: endpoint, params, request/response shape, DB changes.
- Code must match the spec exactly — flag any deviations.

### UI SDD
- A **Figma design** must exist before any UI component code is written.
- A **UI design doc** must exist in `docs/design/` (prefix: `ui-`) before coding.
- Code must implement the Figma spec exactly — never invent UI without a design reference.
- Every component must have a matching **Storybook story** for each visual state.

#### UI Spec Stack
| Layer | Tool |
|-------|------|
| Design spec | Figma (source of truth) |
| User stories | Confluence |
| Living contract | Storybook |
| Visual regression | Jest snapshots / Chromatic |

#### Component File Structure
```
src/components/
  <ComponentName>/
    <ComponentName>.jsx         ← Component implementation
    <ComponentName>.stories.jsx ← Storybook stories (one per state)
    <ComponentName>.test.jsx    ← Unit tests
```

#### Storybook Story Requirements
- Every component needs stories for: `Default`, `Loading`, `Empty`, `Error`
- Story names must match Figma frame names where possible
- Export a `Default` story at minimum

#### UI Component Rules
- Always implement all visual states: default, loading, empty, error
- Always add ARIA labels and keyboard navigation
- Never hardcode colours — always use design tokens / CSS variables
- Always implement responsive behaviour for mobile, tablet, desktop
- Use React functional components with hooks only — no class components

---

## Branching
- Feature branches: `feature/<short-description>`
- UI branches: `ui/<short-description>`
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
Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `breaking`, `ui`.

Examples:
```
feat(analytics): add event-type filter to user endpoint
fix(db): handle null userId gracefully
ui(dashboard): add analytics event chart component
breaking(analytics): restructure response payload for v2
```

---

## Breaking Changes
- Always use a versioned branch (e.g. `ver2.0`) for breaking changes.
- Create `BREAKING_CHANGES.md` at the root describing what changed and migration steps.
- Bump `package.json` version following **SemVer** (breaking = MAJOR bump).
- Never remove or rename existing query params without a major version bump.

---

## Design Documents: GitHub vs Confluence Split

### GitHub `docs/design/` — Code-centric, lives with the repo
Put here: API specs, SQL/schema changes, breaking change details, UI component props/states/tokens/accessibility, Storybook story definitions, implementation decisions.

### Confluence — Team-centric, visible to all stakeholders
Put here: High-level architecture, product requirements, user stories + acceptance criteria, ADRs, runbooks, onboarding, roadmap, cross-team communication.

### Never duplicate — always cross-reference
- GitHub design doc header must include `**Confluence**:` and `**Figma**:` links.
- Confluence page must include a `**GitHub Design Doc**:` link.
- Both are created automatically — no copy/paste required.

---

## Pull Requests
- PR titles follow Conventional Commits format.
- API PR descriptions must include: Summary, Changes, Breaking Changes, How to Test, Related Issues.
- UI PR descriptions must also include: Screenshots or Figma link, Visual States covered, Storybook link.
- All PRs require at least one reviewer and must pass CI before merging.
- PRs with breaking changes must be labeled `breaking-change`.
- PRs with UI changes must include a screenshot or Figma link.
