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
| `feat` | New feature or endpoint |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates, config |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code restructure without behavior change |
| `perf` | Performance improvements |
| `breaking` | Breaking API or schema changes |

### Examples
```
feat(analytics): add event-type filter to user endpoint
fix(db): handle null userId gracefully
breaking(analytics): restructure response payload for v2
test(analytics): add edge case tests for date validation
chore: upgrade pg driver to v8.12
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
- Every feature, fix, or breaking change must go through a PR before merging to `main`.
- Never merge your own PR without review (in team settings).

### PR Title
- Follow the same Conventional Commits format as commit messages.
- Example: `feat(analytics): add pagination support to user endpoint`

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

## How to Test
<!-- Steps to manually verify the changes -->

## Related Issues
<!-- Closes #<issue_number> or N/A -->
```

### PR Rules
- All PRs must have **at least one reviewer** assigned.
- PRs with breaking changes must be labeled `breaking-change`.
- PRs must pass all **CI checks** (tests, lint) before merging.
- Squash commits when merging feature branches; preserve commits for versioned branches.
- Link the PR to the related issue or ticket.

---

## 5. Testing Requirements

### Framework
- **Jest** for unit and integration tests.
- **Supertest** for HTTP endpoint testing.

### File Structure
```
src/
  __tests__/
    analytics.test.js
    db.test.js
```

### Coverage Requirements
- Minimum **80% code coverage** across lines, branches, functions, and statements.
- Every new endpoint or function must have corresponding tests before merging.

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
| Development | feature/fix branches | Local development & testing |
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

## 8. Design Documents

### When to Create a Design Document
A design document is **required** before starting work on any of the following:
- A new API endpoint or service
- A breaking change or major version bump
- A database schema change
- A significant architectural change (caching, queuing, new integrations)
- Any feature estimated to take more than 1 day of work

For small bug fixes, dependency upgrades, or minor tweaks, a design doc is **not required**.

### Where to Store Design Documents
- All design documents live in the **`docs/design/`** folder at the root of the repo.
- File naming: `<YYYY-MM-DD>-<short-description>.md` (e.g. `2026-05-09-add-pagination.md`)
- For breaking changes / major versions, also place a copy at the root as `BREAKING_CHANGES.md`.

```
analyticservice/
├── docs/
│   └── design/
│       ├── 2026-04-22-initial-analytics-service.md
│       ├── 2026-05-09-add-pagination.md
│       └── 2026-05-09-ver2-breaking-changes.md
├── .claude/
│   └── CLAUDE.md
├── src/
└── ...
```

### Design Document Template
Every design document must follow this structure:

```markdown
# Design Document: <Feature or Change Title>

**Date**: YYYY-MM-DD
**Author**: <name or team>
**Branch**: <branch name>
**Version**: <SemVer e.g. 2.0.0>
**Status**: Draft | In Review | Approved | Implemented
**Confluence**: <link to Confluence page>

---

## 1. Overview
## 2. Problem Statement
## 3. Goals
## 4. Non-Goals
## 5. Proposed Solution
  ### 5.1 API Changes
  ### 5.2 Request & Response Changes
  ### 5.3 Database Changes
  ### 5.4 Architecture Changes
## 6. Breaking Changes
## 7. Migration Plan
## 8. Testing Plan
## 9. Rollout Plan
## 10. Risks & Mitigations
## 11. Open Questions
## 12. References
```

### Design Document Lifecycle
1. **Draft** — Claude or the developer creates the GitHub doc and Confluence page before coding starts.
2. **In Review** — Shared with the team for feedback; update the `Status` field in both places.
3. **Approved** — Sign-off received; coding can begin.
4. **Implemented** — Feature is merged; both docs updated with any deviations from the plan.

### Claude's Responsibility
- When asked to implement a new feature or breaking change, **always check `docs/design/`** for an existing design doc first.
- If no design doc exists for a significant change, **create one and ask the user to review it** before writing any code.
- When implementing from a design doc, **follow it strictly** and flag any deviations to the user.
- After implementation, **update the design doc status** to `Implemented` in both GitHub and Confluence.

---

## 9. GitHub vs Confluence Documentation Split

Never duplicate content between GitHub and Confluence. Each has a distinct purpose. Cross-reference instead.

### Rule: What Goes Where

| Content Type | GitHub `docs/design/` | Confluence |
|---|---|---|
| API endpoint spec (params, request/response) | ✅ | ❌ |
| SQL queries & DB schema changes | ✅ | ❌ |
| Breaking change details & migration steps | ✅ | ❌ |
| Implementation decisions tied to code | ✅ | ❌ |
| Code-level architecture (module structure) | ✅ | ❌ |
| High-level system architecture overview | ❌ | ✅ |
| Product requirements & user stories | ❌ | ✅ |
| Architecture Decision Records (ADRs) | ❌ | ✅ |
| Runbooks & on-call / incident guides | ❌ | ✅ |
| Onboarding & team setup guides | ❌ | ✅ |
| Cross-team communication & announcements | ❌ | ✅ |
| Roadmap & release planning | ❌ | ✅ |
| QA test plans (non-unit) | ❌ | ✅ |

### Rule: Always Cross-Reference
- Every GitHub design doc **must** include a `**Confluence**:` link in its header pointing to the related Confluence page.
- Every Confluence page **must** include a `**GitHub Design Doc**:` link pointing to the file in the repo.
- Never copy content between the two — link to the other source instead.

### Rule: Confluence Page Structure
Every Confluence page paired with a GitHub design doc must follow this template (see `docs/confluence-template.md`):

```
Title: [analyticservice] <Feature Name>
Labels: analyticservice, design, <version>

Sections:
1. Summary (2-3 sentences, non-technical)
2. Background & Motivation
3. High-Level Architecture
4. Stakeholders & Approvers
5. Timeline
6. Links (GitHub design doc, PR, branch, Jira ticket)
7. Open Questions (cross-team only)
8. Decision Log
```

### Rule: Who Owns What
| Owner | Responsible For |
|---|---|
| Developer / Claude | GitHub `docs/design/` — technical spec, always up to date with code |
| Developer / Claude | Creating the initial Confluence page stub with links |
| PM / Tech Lead | Filling in Confluence business context, stakeholders, timeline |
| Everyone | Keeping cross-references accurate after changes |

### Claude's Responsibility for Confluence
- When creating a GitHub design doc, **always also create a `docs/confluence-template-<name>.md`** file as a ready-to-paste Confluence page stub.
- The stub must include the GitHub doc link, branch name, and all section headers pre-filled.
- Remind the user: *"Please paste this into Confluence under the `analyticservice` space and add the Confluence URL back to the GitHub design doc header."*
- Never create the Confluence page directly — Claude creates the stub file; the user pastes it into Confluence.

---

## 10. General Claude Behaviour Rules

- Always work on the **correct branch** for the task — confirm with the user if unsure.
- When making changes, **read existing files first** before modifying them.
- Never remove existing functionality unless explicitly asked.
- Always add or update **tests** when modifying route handlers or business logic.
- When adding new endpoints, follow the existing patterns in `src/routes/analytics.js`.
- Always use **parameterized SQL queries** — never build SQL with string concatenation.
- When pushing multiple files, use a **single commit** with a clear message.
- If a task involves breaking changes, **confirm with the user** before proceeding.
- Keep `main` branch always **deployable**.
