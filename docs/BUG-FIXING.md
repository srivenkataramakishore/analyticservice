# BUG-FIXING.md — Standard Bug Fixing Practices

This document defines the standard process and practices for identifying, triaging, fixing, and verifying bugs in the `analyticservice` repository. It applies to **all AI assistants** (Claude, GitHub Copilot) and human developers.

---

## ⚠️ Read First

- Bug fixes do **not** require a `REQ-NNN` requirements document.
- But every bug fix **must** have a Jira ticket (`KN-N`) before work begins.
- If no Jira ticket exists, create one first (project: `KN`, type: `Bug`).
- Never push a fix directly to `main` — always use a `fix/` branch and open a PR.

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

| Severity | Definition | Response time |
|---|---|---|
| **P1 — Critical** | Data loss, security issue, service down | Immediate hotfix |
| **P2 — High** | Core feature broken, no workaround | Same day |
| **P3 — Medium** | Feature degraded, workaround exists | Next sprint |
| **P4 — Low** | Cosmetic, minor UX issue | Backlog |

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

## 4. Writing the Fix

### 4.1 Rules

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
| DB or server error | `500 Internal Server Error` |

### 4.2 Common bug patterns in this codebase

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

## 5. Testing the Fix

### 5.1 Write a failing test first (TDD)

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

### 5.2 Coverage requirements

- Every bug fix **must** include at least one new test covering the exact failure scenario.
- Do not reduce existing coverage — minimum **80%** must be maintained.
- Always test:
  - The exact bug scenario (the regression test)
  - The happy path still works
  - Edge cases around the fixed area

### 5.3 Run the full suite

```bash
npm test                   # all tests must pass
npm test -- --coverage     # coverage must stay ≥ 80%
```

---

## 6. Commit Message

Follow Conventional Commits:

```
fix(<scope>): <short description under 72 chars>

<optional body — explain what was broken and why this fixes it>

Closes KN-<N>
```

**Examples:**
```
fix(analytics): return 400 when userId param is missing
fix(db): handle null result from pool query gracefully
fix(auth): reject expired JWT with 401 instead of 500
```

---

## 7. Pull Request

Open a PR from `fix/<description>` → `main`. Use this description template:

```markdown
## Summary
<!-- One sentence: what was broken and what the fix does -->

## Bug Details
- **Jira**: [KN-<N>](https://srivenkatarama.atlassian.net/browse/KN-<N>)
- **Severity**: P1 / P2 / P3 / P4
- **Root cause**: <!-- e.g. missing null guard on userId param -->
- **Affected area**: <!-- e.g. GET /analytics/user route handler -->

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
- P1 hotfixes may self-merge after tests pass — document the reason.

---

## 8. Post-Fix

1. **Transition the Jira ticket** to `Done`.
2. **Delete the branch** after merge.
3. **Monitor logs** for 15 minutes post-deploy to confirm the fix holds.
4. **For P1/P2 bugs**: write a brief incident note in Confluence under the `analyticservice — Design Documents Index` page covering:
   - What broke
   - Root cause
   - Fix applied
   - How to prevent recurrence

---

## 9. Hotfix Process (P1 only)

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
- Document the hotfix in Confluence within 24 hours.
- Follow up with a proper root-cause analysis on the Jira ticket.

---

## 10. Quick Reference Checklist

```
[ ] Jira ticket exists with correct severity
[ ] Branched from main as fix/<description> or hotfix/<description>
[ ] Bug reproduced locally before writing any code
[ ] Root cause identified (not just symptoms)
[ ] Fix is minimal — only addresses the reported bug
[ ] Regression test written (fails before fix, passes after)
[ ] Full test suite passes: npm test
[ ] Coverage ≥ 80%: npm test -- --coverage
[ ] Commit message follows fix(<scope>): format with Closes KN-N
[ ] PR description filled with bug details, root cause, and test checklist
[ ] Jira ticket transitioned to Done after merge
[ ] Branch deleted after merge
[ ] Logs monitored 15 min post-deploy
```
