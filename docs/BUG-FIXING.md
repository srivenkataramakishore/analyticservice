# BUG-FIXING.md — Standard Bug Fixing Practices

This document defines the standard process and practices for identifying, triaging, fixing, and verifying bugs in the `analyticservice` repository. It applies to **all AI assistants** (Claude, GitHub Copilot) and human developers.

---

## ⚠️ Read First

- Bug fixes do **not** require a `REQ-NNN` requirements document.
- But every bug fix **must** have a Jira ticket (`KN-N`) before work begins.
- If no Jira ticket exists, create one first (project: `KN`, type: `Bug`).
- Never push a fix directly to `main` — always use a `fix/` branch and open a PR.

---

## Bug Fix SDLC — Stage Overview

```
1. Triage          → severity, Jira ticket, owner assigned
       ↓
2. Branch          → fix/<description> or hotfix/<description> from main
       ↓
3. Diagnose        → logs, reproduce locally, isolate root cause
       ↓
4. RCA             → written root cause analysis before any code is written
       ↓
5. Fix             → minimal code change scoped to the bug
       ↓
6. Test            → regression test first (TDD), full suite, coverage ≥ 80%
       ↓
7. Commit + PR     → conventional commit, PR with bug template
       ↓
8. Post-Fix        → Jira Done, branch deleted, logs monitored, RCA published
```

---

## 1. Bug Triage

Before touching any code, answer these questions:

| Question | Why it matters |
|---|---|
| What is the exact error / unexpected behaviour? | Scope the fix precisely |
| Is it reproducible? How? | Confirms the bug is real |
| Which endpoint, component, or module is affected? | Narrows the search area |
| Is there a stack trace or log output? | Points to root cause |
| Is data corrupted or just a display issue? | Determines urgency |
| Is this a regression? What changed recently? | Check git log / blame |

**Severity levels:**

| Severity | Definition | Response time | RCA required? |
|---|---|---|---|
| **P1 — Critical** | Data loss, security issue, service down | Immediate hotfix | Yes — within 24 hrs |
| **P2 — High** | Core feature broken, no workaround | Same day | Yes — before PR merge |
| **P3 — Medium** | Feature degraded, workaround exists | Next sprint | Optional |
| **P4 — Low** | Cosmetic, minor UX issue | Backlog | No |

Set severity on the Jira ticket before starting work.

---

## 2. Branching

Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b fix/<short-description>
```

**Branch naming:**
- Standard bug: `fix/<short-description>` (e.g. `fix/null-userid-crash`)
- Critical / production hotfix: `hotfix/<short-description>` (e.g. `hotfix/db-timeout`)

Delete the branch after the PR is merged.

---

## 3. Diagnosing the Bug

### 3.1 Start with logs

```bash
# CloudWatch — filter for errors in the last hour
aws logs filter-log-events \
  --log-group-name "/your/log/group" \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s000)

# CloudWatch Insights — structured query
aws logs start-query \
  --log-group-name "/your/log/group" \
  --start-time $(date -d '1 hour ago' +%s000) \
  --end-time $(date +%s000) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50'
```

### 3.2 Reproduce locally

1. Identify the failing request (endpoint, params, payload).
2. Replicate the exact call locally:
   ```bash
   curl -X GET "http://localhost:3000/analytics/user?userId=123"
   ```
3. Confirm you see the same error before writing any fix.

### 3.3 Isolate the root cause

- Run the specific test file to see what fails:
  ```bash
  npm test -- --testPathPattern=analytics
  ```
- Use `git log --oneline -20` and `git blame <file>` to identify recent changes.
- Check if the bug is in: route handler → service logic → DB query → response shaping.

---

## 4. Root Cause Analysis (RCA)

For P1 and P2 bugs, a written RCA is **required before writing the fix**. It forces precise understanding of what broke and why, preventing a symptom-only patch.

For P3 bugs it is optional but encouraged. For P4 it is not required.

### 4.1 RCA Template

Write the RCA as a comment on the Jira ticket first. For P1/P2, also publish it as a Confluence page under `analyticservice — Design Documents Index` after the fix is deployed.

```markdown
## Root Cause Analysis — <Short Bug Title>

**Date:** YYYY-MM-DD
**Severity:** P1 / P2 / P3
**Jira:** KN-<N>
**Author:** <your name>

---

### What Happened
<!-- One paragraph: what the user/system experienced -->

### Timeline
| Time | Event |
|---|---|
| T+0 | First error appeared in logs |
| T+X | Alert fired / issue reported |
| T+X | Investigation started |
| T+X | Root cause identified |
| T+X | Fix deployed |
| T+X | Service recovered |

### Root Cause
<!-- The precise technical reason the bug occurred.
     Not the symptom — the underlying cause.
     Example: "The catch block in GET /analytics/user returns 500 for all
     error types, including DB pool timeouts. The upstream circuit breaker
     treats 500s as service failures and opens after 5 consecutive errors." -->

### Contributing Factors
<!-- What conditions made this bug possible or harder to catch?
     Examples: missing test coverage, no error differentiation,
     no alerting on pool exhaustion, recent deploy without smoke test -->
- 
- 

### Impact
<!-- Who was affected, how many requests failed, any data loss? -->
- Users affected:
- Duration:
- Requests failed:
- Data loss: Yes / No

### Fix Applied
<!-- What code changed and why it resolves the root cause -->

### Verification
<!-- How was the fix confirmed to work? -->
- [ ] Regression test passes
- [ ] Full test suite passes
- [ ] Logs monitored 15 min post-deploy — no recurrence

### Prevention — What Changes So This Cannot Happen Again
<!-- Specific, actionable items. Each must have an owner and Jira ticket. -->
| Action | Owner | Jira |
|---|---|---|
| Add test for error type differentiation in catch blocks | | KN-<N> |
| Add CloudWatch alert for pool exhaustion | | KN-<N> |
| Add smoke test to deployment pipeline | | KN-<N> |
```

### 4.2 RCA Rules

- **Root cause ≠ symptom.** "503 was returned" is a symptom. "All error types were mapped to 500 in the catch block, causing the upstream circuit breaker to misclassify transient DB timeouts as service failures" is a root cause.
- **Use the 5 Whys technique** to drill down:
  - Why did the circuit breaker open? → Because it received 5 consecutive 500s.
  - Why did it receive 500s? → Because the catch block returns 500 for all errors.
  - Why does the catch block do that? → No error type differentiation was implemented.
  - Why was that missed? → No test case for DB timeout scenarios.
  - Why was there no test? → Test coverage only covered happy path and missing params.
- **Prevention actions must be specific and tracked.** "Be more careful" is not an action. "Add a Jest test for pool timeout returning 503" with a KN ticket is.
- **P1 RCA must be posted to Confluence within 24 hours of the fix.**
- **P2 RCA must be attached to the PR before merge.**

---

## 5. Writing the Fix

### 5.1 Rules

- Fix **only** what the bug report describes — do not refactor unrelated code.
- Follow all code style rules from `CLAUDE.md` / `copilot-instructions.md`:
  - `async/await`, never `.then()/.catch()`
  - Parameterized SQL only — never string-interpolate
  - Always wrap async handlers in `try/catch`
  - Never expose stack traces to the client
- If the fix touches a SQL query, verify it uses `$1`, `$2` placeholders.
- If the fix touches error handling, make sure the HTTP status code is correct:

| Scenario | Status code |
|---|---|
| Missing required param | `400 Bad Request` |
| Unauthorised | `401 Unauthorized` |
| Forbidden | `403 Forbidden` |
| Resource not found | `404 Not Found` |
| DB connection / timeout | `503 Service Unavailable` |
| DB or server error | `500 Internal Server Error` |

### 5.2 Common bug patterns in this codebase

| Pattern | What to check |
|---|---|
| `null` / `undefined` crash | Guard with `if (!param) return res.status(400)...` |
| SQL injection risk | Use `$1`, `$2` — never template literals in queries |
| Unhandled promise rejection | Add `try/catch` around `await` calls |
| Wrong HTTP status | Match the table above |
| Missing `ORDER BY` | All event queries need `ORDER BY event_time DESC` |
| Ad-hoc DB connection | Always use pool from `src/db.js` |
| Hardcoded secret | Move to `process.env` |

---

## 6. Testing the Fix

### 6.1 Write a failing test first (TDD)

Before applying the fix, write a test that reproduces the bug:

```javascript
describe('GET /analytics/user', () => {
  it('should return 400 if userId is missing', async () => {
    const res = await request(app).get('/analytics/user');
    expect(res.status).toBe(400);
  });
});
```

Run it — it should **fail**. Then apply the fix and confirm it **passes**.

### 6.2 Coverage requirements

- Every bug fix **must** include at least one new test covering the exact failure scenario.
- Do not reduce existing coverage — minimum **80%** must be maintained.
- Always test:
  - The exact bug scenario (the regression test)
  - The happy path still works
  - Edge cases around the fixed area

### 6.3 Run the full suite

```bash
npm test                   # all tests must pass
npm test -- --coverage     # coverage must stay ≥ 80%
```

---

## 7. Commit Message

Follow Conventional Commits:

```
fix(<scope>): <short description under 72 chars>

<optional body — explain what was broken and why this fixes it>

Closes KN-<N>
```

**Examples:**
```
fix(analytics): return 503 on DB timeout instead of 500
fix(analytics): return 400 when userId param is missing
fix(db): handle null result from pool query gracefully
```

---

## 8. Pull Request

Open a PR from `fix/<description>` → `main`. Use this description template:

```markdown
## Summary
<!-- One sentence: what was broken and what the fix does -->

## Bug Details
- **Jira**: [KN-<N>](https://srivenkatarama.atlassian.net/browse/KN-<N>)
- **Severity**: P1 / P2 / P3 / P4
- **Root cause**: <!-- one line summary from RCA -->
- **Affected area**: <!-- e.g. GET /analytics/user route handler -->
- **RCA**: <!-- link to Jira comment or Confluence page -->

## Reproduction Steps
1. 
2. 
3. 

## Fix Description
<!-- What changed and why -->

## Tests Added
- [ ] Regression test for the exact failure scenario
- [ ] Happy path still passes
- [ ] Coverage ≥ 80%

## Breaking Changes
<!-- None, or describe if the fix changes API behaviour -->

## Related Issues
Closes KN-<N>
```

**PR rules:**
- Squash merge into `main`.
- All CI checks (tests, lint) must pass.
- At least one reviewer for P2+.
- P2 bugs: RCA must be linked in the PR before merge.
- P1 hotfixes may self-merge after tests pass — RCA due within 24 hours post-deploy.

---

## 9. Post-Fix

1. **Transition the Jira ticket** to `Done`.
2. **Delete the branch** after merge.
3. **Monitor logs** for 15 minutes post-deploy to confirm the fix holds.
4. **Publish RCA to Confluence** (P1 within 24 hrs, P2 before merge) under `analyticservice — Design Documents Index`.
5. **Create follow-up Jira tickets** for every prevention action identified in the RCA.

---

## 10. Hotfix Process (P1 only)

For production-critical bugs that cannot wait for a normal PR cycle:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<description>
# fix, test, commit
git push origin hotfix/<description>
# open PR → squash merge → deploy immediately
```

- Tests must still pass before merging — no exceptions.
- RCA must be posted to Confluence within 24 hours.
- Follow-up prevention tickets must be created on the Jira board within 48 hours.

---

## 11. Quick Reference Checklist

```
[ ] Jira ticket exists with correct severity
[ ] Branched from main as fix/<description> or hotfix/<description>
[ ] Bug reproduced locally before writing any code
[ ] Root cause identified (not just symptoms)
[ ] RCA written (required for P1/P2) — posted to Jira ticket
[ ] Fix is minimal — only addresses the reported bug
[ ] Regression test written (fails before fix, passes after)
[ ] Full test suite passes: npm test
[ ] Coverage ≥ 80%: npm test -- --coverage
[ ] Commit message follows fix(<scope>): format with Closes KN-N
[ ] PR description filled with bug details, root cause, and RCA link
[ ] RCA published to Confluence (P2 before merge, P1 within 24 hrs post-deploy)
[ ] Prevention tickets created in Jira for each RCA action item
[ ] Jira ticket transitioned to Done after merge
[ ] Branch deleted after merge
[ ] Logs monitored 15 min post-deploy
```
