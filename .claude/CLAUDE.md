# CLAUDE.md — SDLC Instructions for Claude

This file defines how Claude should behave across all software development lifecycle (SDLC) activities in the `analyticservice` repository. Follow these instructions for every task unless explicitly overridden by the user.

---

## 1. Branching Strategy

- **Default branch**: `main` — always production-ready, never push breaking changes directly.
- **Branch from**: Always create new branches from `main` unless told otherwise.
- **Branch naming conventions**:
  - Feature: `feature/<short-description>` (e.g. `feature/add-event-filter`)
  - Bug fix: `fix/<short-description>` (e.g. `fix/null-userid-crash`)
  - Breaking changes / major versions: `ver<X.Y>` (e.g. `ver2.0`)
  - Hotfix: `hotfix/<short-description>` (e.g. `hotfix/db-timeout`)
  - Chore / maintenance: `chore/<short-description>` (e.g. `chore/update-dependencies`)
  - UI component: `ui/<short-description>` (e.g. `ui/analytics-dashboard`)
- **Never** push directly to `main` for breaking changes — always use a versioned branch (e.g. `ver2.0`).
- **Delete branches** after they are merged.

---

## 2. Commit Message Format

Follow the **Conventional Commits** specification for all commit messages.

### Format
```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Allowed Types
| Type | When to use |
|------|-------------|
| `feat` | New feature, endpoint, or UI component |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates, config |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code restructure without behavior change |
| `perf` | Performance improvements |
| `breaking` | Breaking API or schema changes |
| `ui` | UI-only changes (styles, layout, components) |

### Examples
```
feat(analytics): add event-type filter to user endpoint
fix(db): handle null userId gracefully
breaking(analytics): restructure response payload for v2
ui(dashboard): add analytics event chart component
test(analytics): add edge case tests for date validation
```

- Keep the summary under **72 characters**.
- Use **imperative mood** ("add", not "added" or "adds").
- Reference issue/ticket numbers in the footer: `Closes #42`.

---

## 3. Code Style & Standards

### General
- Language: **JavaScript (Node.js)**. Do not introduce TypeScript unless explicitly asked.
- Style: Follow **ESLint recommended** rules.
- Indentation: **2 spaces** (no tabs).
- Quotes: **Single quotes** for strings.
- Semicolons: **Always** include semicolons.
- Max line length: **100 characters**.

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|  
| Variables | camelCase | `userId`, `eventTime` |
| Functions | camelCase | `validateDateRange()` |
| Constants | UPPER_SNAKE_CASE | `MAX_POOL_SIZE` |
| Files | kebab-case | `analytics-router.js` |
| Folders | kebab-case | `src/routes/` |
| UI Components | PascalCase | `AnalyticsChart.jsx` |
| UI Props | camelCase | `eventType`, `onDateChange` |

### Node.js / Express Specifics
- Use `async/await` — never use raw `.then()/.catch()` chains.
- Always wrap async route handlers in `try/catch` and return proper HTTP error responses.
- Never expose raw error messages or stack traces to the client.
- Use `process.env` for all config — never hardcode credentials or secrets.
- Always validate and sanitize incoming query params before using them in SQL.
- Use **parameterized queries** (`$1`, `$2`) — never string-interpolate SQL.

### Database
- Table: `analytics_events` with columns `user_id`, `device_id`, `event_type`, `event_time`.
- Always use the connection pool from `src/db.js` — never create ad-hoc connections.
- Add `ORDER BY event_time DESC` to all event queries unless specified otherwise.

---

## 4. Pull Request (PR) Guidelines

### When to open a PR
- Every feature, fix, UI component, or breaking change must go through a PR before merging to `main`.
- Never merge your own PR without review (in team settings).

### PR Title
- Follow the same Conventional Commits format as commit messages.
- Example: `feat(analytics): add pagination support to user endpoint`
- Example: `ui(dashboard): add event type filter component`

### PR Description Template
Always include the following sections in every PR description:

```markdown
## Summary
<!-- What does this PR do? -->

## Changes
- 
- 

## Breaking Changes
<!-- List any breaking changes or write "None" -->

## UI Changes
<!-- Screenshot or Figma link if UI is affected, or write "None" -->

## How to Test
<!-- Steps to manually verify the changes -->

## Related Issues
<!-- Closes #<issue_number> or N/A -->
```

### PR Rules
- All PRs must have **at least one reviewer** assigned.
- PRs with breaking changes must be labeled `breaking-change`.
- PRs with UI changes must include a screenshot or Figma link.
- PRs must pass all **CI checks** (tests, lint) before merging.
- Squash commits when merging feature branches; preserve commits for versioned branches.
- Link the PR to the related issue or ticket.

---

## 5. Testing Requirements

### Framework
- **Jest** for unit and integration tests.
- **Supertest** for HTTP endpoint testing.
- **Storybook** for UI component visual testing (when UI is involved).

### File Structure
```
src/
  __tests__/
    analytics.test.js
    db.test.js
  components/
    <ComponentName>/
      <ComponentName>.jsx
      <ComponentName>.stories.jsx   ← Storybook stories
      <ComponentName>.test.jsx      ← Unit tests
```

### Coverage Requirements
- Minimum **80% code coverage** across lines, branches, functions, and statements.
- Every new endpoint or function must have corresponding tests before merging.
- Every new UI component must have at least one Storybook story per major state.

### Test Naming Convention
```javascript
describe('GET /analytics/user', () => {
  it('should return 400 if userId is missing', ...);
  it('should return 200 with data for valid request', ...);
  it('should return 500 on database error', ...);
});
```
- Use `describe` to group by route or module.
- Use `it('should ...')` for individual test cases.
- Always test: **happy path**, **missing params**, **invalid input**, **DB/server errors**.

### Mocking
- Always mock `src/db.js` pool in unit tests — never connect to a real database in tests.
- Use `jest.mock('../db')` and `mockResolvedValueOnce` / `mockRejectedValueOnce`.

### Running Tests
```bash
npm test                  # run all tests
npm test -- --coverage    # run with coverage report
npm run storybook         # run Storybook for UI visual testing
```

---

## 6. Breaking Change Policy

- **Breaking changes** are any changes that alter existing API contracts:
  - Renaming or removing query parameters
  - Changing response payload structure
  - Removing endpoints
  - Changing HTTP status codes for existing scenarios
  - Schema changes in `analytics_events`

### Process for Breaking Changes
1. Always create a **versioned branch** (e.g. `ver2.0`) from `main`.
2. Add a `BREAKING_CHANGES.md` file documenting what changed and migration steps.
3. Update the `version` field in `package.json` (e.g. `0.1.0` → `2.0.0`) following **SemVer**.
4. Label the PR as `breaking-change`.
5. Do **not** delete the old version branch until the new version is fully stable.
6. Notify consumers of the API via changelog or release notes.

### SemVer Rules
| Change Type | Version Bump |
|-------------|-------------|
| Breaking change | MAJOR (e.g. 1.x.x → 2.0.0) |
| New feature (backward compatible) | MINOR (e.g. 1.0.x → 1.1.0) |
| Bug fix | PATCH (e.g. 1.0.0 → 1.0.1) |

---

## 7. Deployment Process

### Environments
| Environment | Branch | Purpose |
|-------------|--------|---------|  
| Development | feature/fix/ui branches | Local development & testing |
| Staging | `ver<X.Y>` or `main` (pre-release) | QA and integration testing |
| Production | `main` | Live traffic |

### Deployment Steps
1. **Never deploy directly to production** — always go through staging first.
2. Run the full test suite before deploying: `npm test`.
3. Verify environment variables are set correctly for the target environment.
4. Use **blue-green deployment** to avoid downtime (as defined in `API_PERFORMANCE_DESIGN.md`).
5. Monitor logs and metrics for at least **15 minutes** post-deployment.
6. Keep a **rollback plan** ready — know the previous stable commit SHA.

### Rollback
- If a deployment causes errors, revert to the last known good commit immediately.
- Document the incident and root cause before redeploying.

---

## 8. Spec-Driven Development (SDD)

This project follows **Spec-Driven Development** — the spec is always written and approved before any code is written, for both API and UI work.

### 8.1 API Spec-Driven Development

#### API Spec Workflow
```
Design doc written (GitHub + Confluence)
       ↓
User approves
       ↓
Code implemented to match spec
       ↓
Tests validate against spec
       ↓
Status updated to Implemented
```

#### API Design Doc Requirements
- Stored in `docs/design/<YYYY-MM-DD>-<short-description>.md`
- Must include: endpoint definition, request params, response shape (before/after for breaking changes), DB changes, migration plan
- Always paired with a Confluence page (created automatically by Claude)
- Header must include `**Confluence**:` URL

#### API Spec Lifecycle
1. **Draft** — Claude creates GitHub doc + Confluence page simultaneously
2. **In Review** — User reviews; Claude updates status in both
3. **Approved** — User confirms; Claude implements code
4. **Implemented** — Claude updates status in both after merge

---

### 8.2 UI Spec-Driven Development

For UI work, the spec lives in **Figma** (design) and **Confluence** (user stories + acceptance criteria). Code is never written before the Figma spec exists and is approved.

#### UI Spec Stack
| Layer | Tool | Purpose |
|-------|------|---------|
| **Design spec** | Figma | Source of truth — components, variants, states, tokens |
| **User stories** | Confluence | Who needs it, why, acceptance criteria |
| **Living contract** | Storybook | Running visual spec — all states documented |
| **Visual regression** | Chromatic / Jest snapshots | Catch unintended UI changes in CI |
| **Code** | React / HTML | Implements the Figma spec |

#### UI Spec Workflow
```
Figma design exists and is approved
       ↓
Claude reads Figma (via Figma MCP)
       ↓
Claude creates UI design doc (GitHub docs/design/)
       ↓
Claude creates Confluence page (user stories + acceptance criteria)
       ↓
User approves
       ↓
Claude generates component code from Figma spec
       ↓
Claude generates Storybook stories for all component states
       ↓
Claude writes unit tests (props, states, interactions)
       ↓
Status updated to Implemented in GitHub + Confluence
```

#### UI Design Doc Requirements
- Stored in `docs/design/<YYYY-MM-DD>-ui-<short-description>.md`
- Must include:
  - Figma link
  - Component name, props, and their types
  - All visual states (default, hover, loading, empty, error)
  - Accessibility requirements (ARIA labels, keyboard nav, contrast)
  - Responsive behaviour (mobile/tablet/desktop breakpoints)
  - Design tokens used (colors, spacing, typography)
- Always paired with a Confluence page (user stories + AC)

#### UI Design Doc Template
```markdown
# UI Design Document: <Component Name>

**Date**: YYYY-MM-DD
**Author**: <name>
**Branch**: ui/<short-description>
**Version**: <SemVer>
**Status**: Draft | In Review | Approved | Implemented
**Figma**: <Figma file/frame URL>
**Confluence**: <URL — added automatically by Claude>

---

## 1. Overview
<!-- What is this component? Where is it used? -->

## 2. Component Props
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| eventType | string | Yes | — | Event type to display |

## 3. Visual States
| State | Description | Figma Frame |
|-------|-------------|-------------|
| Default | Normal loaded state | <link> |
| Loading | Skeleton/spinner shown | <link> |
| Empty | No data available | <link> |
| Error | Failed to load | <link> |

## 4. Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #0052CC | CTA buttons |

## 5. Accessibility
- ARIA labels required: ...
- Keyboard navigation: ...
- Colour contrast: WCAG AA minimum

## 6. Responsive Behaviour
| Breakpoint | Behaviour |
|------------|-----------|
| Mobile (<768px) | Stacked layout |
| Tablet (768-1024px) | 2-column |
| Desktop (>1024px) | Full layout |

## 7. Acceptance Criteria
- Given <context>, when <action>, then <result>

## 8. References
- Figma: <link>
- Storybook: <link once created>
```

#### Confluence Page for UI (User Stories)
Each UI Confluence page must contain:
1. Summary (non-technical, 2-3 sentences)
2. User Stories with Acceptance Criteria
3. Figma link
4. Stakeholders & Approvers
5. Timeline
6. Links (GitHub design doc, branch, PR)
7. Open Questions
8. Decision Log

#### Storybook Requirements
- Every component must have a `.stories.jsx` file
- Stories must cover every visual state: Default, Loading, Empty, Error
- Story names must match Figma frame names where possible
- Run with: `npm run storybook`

#### Claude's UI Responsibilities
- Always check if a Figma spec exists before writing any UI code
- If no Figma spec exists, ask the user to provide a Figma link or describe the UI before proceeding
- Read the Figma file via the Figma MCP to extract component structure, props, and design tokens
- Generate code that matches the Figma spec exactly — never invent UI that isn't in the spec
- Always generate Storybook stories alongside component code
- Always create both the GitHub UI design doc and the Confluence page automatically

---

## 9. Design Documents

### When to Create a Design Document
A design document is **required** before starting work on any of the following:
- A new API endpoint or service
- A new UI component or page
- A breaking change or major version bump
- A database schema change
- A significant architectural change
- Any feature estimated to take more than 1 day of work

For small bug fixes, dependency upgrades, or minor tweaks, a design doc is **not required**.

### Design Document Lifecycle
1. **Draft** — Claude creates the GitHub doc AND the Confluence page simultaneously. No manual steps.
2. **In Review** — Claude updates `Status` in both GitHub and Confluence.
3. **Approved** — User approves; Claude begins implementation.
4. **Implemented** — Claude updates status to `Implemented` in both after merge.

### Claude's Responsibility
- Always check `docs/design/` before implementing any significant feature or component.
- If no design doc exists, create the GitHub doc AND the Confluence page in one step.
- After creating the Confluence page, immediately update the GitHub doc's `**Confluence**:` field.
- After implementation, update status to `Implemented` in both places automatically.

---

## 10. GitHub vs Confluence Documentation Split

Never duplicate content between GitHub and Confluence. Each has a distinct purpose.

| Content Type | GitHub `docs/design/` | Confluence |
|---|---|---|
| API endpoint spec (params, request/response) | ✅ | ❌ |
| SQL queries & DB schema changes | ✅ | ❌ |
| Breaking change details & migration steps | ✅ | ❌ |
| UI component props, states, tokens, accessibility | ✅ | ❌ |
| Storybook stories | ✅ | ❌ |
| Implementation decisions tied to code | ✅ | ❌ |
| High-level system architecture overview | ❌ | ✅ |
| Product requirements & user stories | ❌ | ✅ |
| UI acceptance criteria | ❌ | ✅ |
| Architecture Decision Records (ADRs) | ❌ | ✅ |
| Runbooks & on-call / incident guides | ❌ | ✅ |
| Onboarding & team setup guides | ❌ | ✅ |
| Roadmap & release planning | ❌ | ✅ |

### Confluence Setup
- **Cloud ID**: `3f5031a1-3ffb-40ce-b0d0-fec16f52130a`
- **Site**: `https://srivenkatarama.atlassian.net/wiki`
- **Space**: Personal space (`spaceId: 65858`)
- **Parent page for all design docs**: `analyticservice — Design Documents Index` (`pageId: 7995404`)
- Each feature/component gets its own **child page** titled `[analyticservice] <Feature or Component Name>`.

### Rule: Always Cross-Reference Automatically
- Claude **always** creates both the GitHub design doc and the Confluence page in the same step.
- Claude **always** updates the GitHub doc's `**Confluence**:` or `**Figma**:` field with live URLs.
- **Never ask the user to copy/paste anything** — Claude handles all operations automatically.

---

## 11. General Claude Behaviour Rules

- Always work on the **correct branch** for the task — confirm with the user if unsure.
- When making changes, **read existing files first** before modifying them.
- Never remove existing functionality unless explicitly asked.
- Always add or update **tests** when modifying route handlers, business logic, or UI components.
- When adding new endpoints, follow the existing patterns in `src/routes/analytics.js`.
- When adding new UI components, always generate the matching Storybook stories.
- Always use **parameterized SQL queries** — never build SQL with string concatenation.
- When pushing multiple files, use a **single commit** with a clear message.
- If a task involves breaking changes, **confirm with the user** before proceeding.
- Keep `main` branch always **deployable**.
- **Never ask the user to copy/paste anything** — Claude handles all GitHub, Confluence, and Figma operations automatically.
- For UI tasks: **always check for a Figma spec first** — never invent UI without a design reference.
