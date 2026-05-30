# REQ-005: Redshift data archival

| Field | Value |
|-------|-------|
| **ID** | REQ-005 |
| **Jira ticket** | — (to be created) |
| **Type** | Data / Infrastructure |
| **Status** | Draft |
| **Author** | Kishore Chivukula |
| **Date** | 2026-05-30 |
| **PR / Commit** | — |

## Description
Implement an automated data archival pipeline for the `analytics_events` table in Redshift. As event volume grows, hot storage costs increase and query performance degrades on older data. This requirement introduces a policy-driven archival job that moves events older than a configurable retention threshold from the live `analytics_events` table into a cold `analytics_events_archive` table in Redshift, while keeping the data queryable for audit and historical reporting purposes.

## User stories
- As a **platform engineer**, I want old events automatically moved to archive storage so that hot table size stays manageable and query performance remains within SLA.
- As a **data analyst**, I want archived events to remain queryable so that I can run historical reports beyond the retention window.
- As an **ops engineer**, I want the archival job to be observable and alertable so that I know immediately if it fails or skips a run.

## Scope
**In scope:**
- Scheduled archival job (cron) that moves events older than `ARCHIVE_AFTER_DAYS` (default: 90 days) from `analytics_events` to `analytics_events_archive`
- Configurable retention threshold via environment variable
- Archival runs in batches to avoid locking the live table
- Structured log output per run (`run_id`, `rows_archived`, `duration_ms`, `status`)
- Migration script for `analytics_events_archive` table
- Dry-run mode that reports what would be archived without moving data

**Out of scope:**
- Deletion / purge of archived data (separate future requirement)
- Moving data to S3 / Glacier (v1 stays within Redshift)
- Real-time / streaming archival (batch only in v1)
- UI for triggering or monitoring archival jobs

## Data flow
```
Redshift: analytics_events (hot)
  ↓  [archival job — runs nightly at 02:00 UTC]
  ↓  SELECT rows WHERE timestamp < NOW() - ARCHIVE_AFTER_DAYS
  ↓  INSERT INTO analytics_events_archive (batched, transactional)
  ↓  DELETE FROM analytics_events (same batch, same transaction)
Redshift: analytics_events_archive (cold, queryable)
```

## Acceptance criteria
- [ ] **AC-1**: Given `ARCHIVE_AFTER_DAYS=90`, when the archival job runs, then all events with `timestamp < NOW() - 90 days` are moved from `analytics_events` to `analytics_events_archive` and no longer appear in the live table.
- [ ] **AC-2**: Given the archival job runs, when it completes, then a structured log entry is emitted containing: `run_id`, `rows_archived`, `duration_ms`, `archive_threshold_date`, `status` (success / partial / failed).
- [ ] **AC-3**: Given the job is run in `--dry-run` mode, then it logs how many rows would be archived but makes no changes to either table.
- [ ] **AC-4**: Given the live table has 0 rows eligible for archival, when the job runs, then it exits cleanly with `rows_archived: 0` and no errors.
- [ ] **AC-5**: Given the INSERT to `analytics_events_archive` fails mid-batch, then the DELETE from `analytics_events` is rolled back and no data is lost.
- [ ] **AC-6**: Given `ARCHIVE_AFTER_DAYS` is not set, then the job defaults to 90 days and logs a warning that the default is being used.
- [ ] **AC-7**: Given the archival job has run, when a data analyst queries `analytics_events_archive` with the same filters as the live table, then archived rows are returned correctly with all original columns intact.
- [ ] **AC-8**: Given the job fails (DB unreachable, timeout), then it exits with a non-zero code and emits a structured error log — it does not silently succeed.

## NFR checklist
- [ ] **Perf** — archival job processes rows in batches of ≤ 10,000 to avoid table locks
- [ ] **Perf** — a single archival run must complete within 30 minutes for up to 10M eligible rows
- [ ] **Security** — archival job uses a dedicated DB role with INSERT on `analytics_events_archive` and DELETE on `analytics_events` only — no broader privileges (NFR-S1 adapted)
- [ ] **Security** — DB credentials loaded from environment variables — never hardcoded (NFR-S7)
- [ ] **Security** — parameterised SQL only — no string interpolation in queries (NFR-S8)
- [ ] **Reliability** — each batch wrapped in a transaction; failure rolls back that batch only, not the whole run (NFR-D1)
- [ ] **Reliability** — job must be idempotent — re-running after a partial failure must not duplicate or lose rows
- [ ] **Reliability** — archival run failure rate < 0.1% over any 30-day window (NFR-R1 adapted)
- [ ] **Observability** — structured JSON log per run: `run_id`, `rows_archived`, `batch_count`, `duration_ms`, `status` (NFR-O1 adapted)
- [ ] **Observability** — dry-run mode produces the same log output with `dry_run: true` and `rows_archived: 0`
- [ ] **Scalability** — batch size configurable via `ARCHIVE_BATCH_SIZE` env var (default: 10,000) (NFR-SC1 adapted)
- [ ] **Data** — `analytics_events_archive` schema mirrors `analytics_events` exactly, plus an `archived_at TIMESTAMPTZ` column (NFR-D2)
- [ ] **Data** — migration script for `analytics_events_archive` included in `migrations/002_create_analytics_events_archive.sql` (NFR-D2)
- [ ] **Data** — indexes on `timestamp` and `user_id` on the archive table (NFR-D3)

## Dependencies
- Redshift connection via `src/db.js` (existing pool)
- `ARCHIVE_AFTER_DAYS` and `ARCHIVE_BATCH_SIZE` added to `.env.example`
- Migration: `migrations/002_create_analytics_events_archive.sql`

## Open questions
- [ ] Should the archival job be a standalone Node.js script (`src/jobs/archive.js`) or triggered via an API endpoint? — **TBD**
- [ ] Should archived data be queryable through the existing `GET /api/v1/analytics/reports` endpoint (via `?include_archive=true`) or a separate endpoint? — **TBD**
- [ ] What is the maximum acceptable archival window — 90 days, 180 days, 1 year? — **TBD**
- [ ] Is there a compliance or audit requirement that mandates how long archived data must be retained before purge? — **TBD**

## Decision log
| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-30 | Archive within Redshift (not S3) in v1 | Keeps data queryable without additional tooling; S3 offload deferred to v2 |
| 2026-05-30 | Batch-based archival, not streaming | Avoids live table contention; nightly off-peak window sufficient for v1 |
