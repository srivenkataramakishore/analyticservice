# AGENTS.md — Copilot Agent Mode Instructions

This file defines how GitHub Copilot in Agent mode should behave across all SDLC activities in the `analyticservice` repository.

---

## ⚠️ Requirements-First Rule — READ THIS FIRST

Before doing ANY work — design docs, code, PRs, Confluence pages, Figma files — you must:

1. Read `docs/REQUIREMENTS.md` in full, including the requirement index at the bottom.
2. Confirm the feature has an entry with status `Approved` before implementing anything.
3. If no entry exists, create a new requirement file `docs/requirements/REQ-<next-ID>-<kebab-case-title>.md` with:
   - Functional description and user stories
   - In scope / out of scope
   - Data flow
   - Acceptance criteria (Given / When / Then, testable)
   - NFR checklist
   - Status: `Draft`
4. Show the draft to the user for review — do not push until confirmed.
5. After confirmation, push the requirement file and updated index together in a single commit.
6. Get user approval to advance status to `Approved`.
7. Only then proceed to design docs, code, and PRs.
8. After merge, update the entry status to `Implemented` in both the requirement file and the index.

> Never write code, create a branch, open a PR, or push any files for a feature that does not have an `Approved` entry in `docs/requirements/`.

---

## 1. Branching Strategy

- Default branch: `main` — always production-ready, never push breaking changes directly.
- Always create new branches from `main` unless told otherwise.
- Branch naming:
  - Feature: `feature/<short-description>`
  - Bug fix: `fix/<short-description>`
  - Breaking changes: `ver<X.Y>` (e.g. `ver2.0`)
  - Hotfix: `hotfix/<short-description>`
  - Chore: `chore/<short-description>`
  - UI component: `ui/<short-description>`
- Never push directly to `main` for breaking changes.
- Delete branches after they are merged.

---

## 2. Commit Message Format

Follow Conventional Commits for all commit messages:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `breaking`, `ui`

- Keep summary under 72 characters.
- Use imperative mood ("add", not "added").
- Reference tickets in footer: `Closes #42`.

---

## 3. Code Style & Standards

- Language: JavaScript (Node.js). Do not introduce TypeScript unless explicitly asked.
- Style: ESLint recommended rules.
- Indentation: 2 spaces (no tabs).
- Quotes: Single quotes for strings.
- Semicolons: Always include.
- Max line length: 100 characters.
- Use `async/await` — never raw `.then()/.catch()` chains.
- Always wrap async route handlers in `try/catch`.
- Never expose raw error messages or stack traces to the client.
- Use `process.env` for all config — never hardcode credentials.
- Always validate and sanitize incoming query params before using in SQL.
- Use parameterized queries (`$1`, `$2`) — never string-interpolate SQL.
- Always use the connection pool from `src/db.js`.
- Add `ORDER BY event_time DESC` to all event queries unless specified otherwise.

### Naming Conventions
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files/Folders: kebab-case
- UI Components: PascalCase
- UI Props: camelCase

---

## 4. Pull Request Guidelines

- Every feature, fix, UI component, or breaking change must go through a PR.
- PR title follows Conventional Commits format.
- Every PR description must include:
  - Summary
  - Link to `docs/requirements/REQ-<ID>-<title>.md`
  - Jira ticket link: `https://srivenkatarama.atlassian.net/browse/KN-<N>`
  - Acceptance criteria checklist (each AC from the requirement file)
  - NFRs addressed
  - Breaking changes (or "None")
  - UI changes with screenshot or Figma link (or "None")
  - How to test
- All PRs must have at least one reviewer.
- PRs with breaking changes must be labeled `breaking-change`.
- PRs must pass all CI checks before merging.
- Squash commits when merging feature branches.

---

## 5. Testing Requirements

- Framework: Jest (unit/integration), Supertest (HTTP), Storybook (UI).
- Minimum 80% code coverage across lines, branches, functions, and statements.
- Every new endpoint or function must have tests before merging.
- Every new UI component must have at least one Storybook story per major state.
- Always mock `src/db.js` in unit tests — never connect to a real database.
- Test naming: use `describe` by route/module, `it('should ...')` for cases.
- Always test: happy path, missing params, invalid input, DB/server errors.

---

## 6. Breaking Change Policy

- Breaking changes: renaming/removing params, changing response shape, removing endpoints, schema changes.
- Always create a versioned branch (e.g. `ver2.0`).
- Add `BREAKING_CHANGES.md` documenting what changed and migration steps.
- Update `version` in `package.json` following SemVer.
- Label PR as `breaking-change`.

---

## 7. Spec-Driven Development

The spec is always written and approved before any code is written.

### API Workflow
1. Requirement file created (`docs/requirements/REQ-<ID>.md`, status: Draft)
2. User approves (status: Approved)
3. Design doc written in `docs/design/` + Confluence page created
4. Code implemented to match spec
5. Tests validate against ACs
6. PR references REQ-<ID> and checks off all ACs and NFRs
7. Merged → status updated to Implemented

### UI Workflow
1. Requirement file created (status: Draft)
2. User approves (status: Approved)
3. Figma design created and shared
4. UI design doc created in `docs/design/` + Confluence page
5. Component code generated from Figma spec
6. Storybook stories generated for all states
7. Unit tests written mapping to ACs
8. PR references REQ-<ID>
9. Merged → status updated to Implemented

---

## 8. Design Documents

- Required before: new API endpoints, new UI components, breaking changes, DB schema changes, architectural changes.
- API design docs: `docs/design/<YYYY-MM-DD>-<short-description>.md`
- UI design docs: `docs/design/<YYYY-MM-DD>-ui-<short-description>.md`
- Always paired with a Confluence page.
- Always cross-reference GitHub doc with Confluence URL and vice versa.

---

## 9. GitHub vs Confluence Split

- GitHub `docs/design/`: API specs, SQL/schema changes, breaking change details, UI component props/states/tokens, Storybook stories, implementation decisions.
- Confluence: High-level architecture, product requirements, user stories, UI acceptance criteria, ADRs, runbooks, onboarding, roadmap.

### Confluence Config
- Cloud ID: `3f5031a1-3ffb-40ce-b0d0-fec16f52130a`
- Site: `https://srivenkatarama.atlassian.net/wiki`
- Parent page for design docs: `analyticservice — Design Documents Index` (pageId: `7995404`)

---

## 10. General Rules

- Always read `docs/REQUIREMENTS.md` and the requirement index before starting any task.
- Always work on the correct branch — confirm with user if unsure.
- Read existing files before modifying them.
- Never remove existing functionality unless explicitly asked.
- Always add or update tests when modifying route handlers, business logic, or UI components.
- Always use parameterized SQL queries.
- When pushing multiple files, use a single commit.
- If a task involves breaking changes, confirm with the user first.
- Keep `main` always deployable.
- For UI tasks: always check for a Figma spec first — never invent UI without a design reference.
- Every PR description must reference `REQ-<ID>` and check off all ACs and NFRs.
- Use the atlassian MCP tool to fetch Jira issues — always reference the Jira ticket in PR descriptions.
