# Confluence Page Template for analyticservice

This file is the **master template** for creating Confluence pages paired with GitHub design docs.

When Claude creates a new GitHub design doc, it also generates a filled-in version of this template as `docs/confluence-template-<feature-name>.md`. Copy that file's content and paste it into Confluence under the `analyticservice` space.

After creating the Confluence page, copy its URL and add it to the GitHub design doc header under `**Confluence**:`.

---

## How to Use
1. Claude generates `docs/confluence-template-<feature-name>.md` alongside the GitHub design doc.
2. You paste it into Confluence: `analyticservice` space → correct parent page.
3. You copy the Confluence page URL back into the GitHub design doc `**Confluence**:` field.
4. Done — both docs are linked.

---

## Confluence Page Template

```
Title: [analyticservice] <Feature Name>
Space: analyticservice
Parent page: Design Documents (or Breaking Changes if applicable)
Labels: analyticservice, design, v<version>

---

## Summary
<!-- 2-3 non-technical sentences. What is this? Why does it matter? Who is affected? -->

---

## Background & Motivation
<!-- What problem prompted this work? What was the gap or pain point? -->

---

## High-Level Architecture
<!-- Diagram or description of how this fits into the broader system.
     No implementation detail — link to GitHub doc for that. -->

---

## Stakeholders & Approvers
| Role | Name | Responsibility |
|------|------|----------------|
| Author | | Owns the design and implementation |
| Tech Lead | | Technical approval |
| PM | | Product approval |
| QA | | Test plan sign-off |

---

## Timeline
| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Design doc created | | Done |
| Design approved | | |
| Implementation complete | | |
| Merged to main | | |
| Released to production | | |

---

## Links
| Resource | URL |
|----------|-----|
| GitHub Design Doc | <link to docs/design/*.md in repo> |
| GitHub Branch | <link to branch> |
| Pull Request | <link to PR once created> |
| Jira Ticket | <link to ticket if applicable> |

---

## Open Questions (Cross-Team)
<!-- Only questions that need input from outside the dev team.
     Dev-only questions go in the GitHub design doc. -->
-

---

## Decision Log
| Date | Decision | Made By | Rationale |
|------|----------|---------|----------|
| | | | |
```

---

## What NOT to Put in Confluence
- API request/response schemas → GitHub design doc
- SQL queries or DB schema details → GitHub design doc
- Code-level implementation decisions → GitHub design doc
- Test cases → GitHub design doc

Link to the GitHub doc instead.
