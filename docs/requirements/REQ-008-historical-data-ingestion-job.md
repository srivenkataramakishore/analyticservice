# REQ-008: Historical Data Ingestion Job

| Field | Value |
|-------|-------|
| **ID** | REQ-008 |
| **Jira ticket** | [KN-9](https://srivenkatarama.atlassian.net/browse/KN-9) |
| **Type** | Infrastructure / Data |
| **Status** | Draft |
| **Author** | srivenkataramakishore |
| **Date** | 2026-06-04 |
| **Figma** | — |
| **PR / Commit** | — |

## Description

Create a background job that ingests historical analytics event data into the `analytics_events` table. The job is needed to backfill data that predates the live ingestion pipeline, enabling accurate historical reporting and trend analysis across the full dataset.

## User stories

- As a **data engineer**, I want a job that loads historical event records into `analytics_events` so that reports cover the full historical period.
- As a **product analyst**, I want historical data to be queryable via the existing analytics API so that I do not need a separate tool for historical vs. live data.
- As an **operator**, I want the job to be idempotent so that re-running it on the same data does not create duplicate records.

## Scope

**In scope:**
- A Node.js script / job in `src/jobs/ingest-historical-data.js` that reads from a source (CSV file or external data store, TBD) and bulk-inserts into `analytics_events`.
- Idempotent inserts — skip or upsert records that already exist (keyed on `user_id + device_id + event_type + event_time`).
- Batched writes of up to 100 events per DB transaction (per NFR-P4).
- Structured logging of progress: records read, records inserted, records skipped, errors.
- A dry-run mode (`--dry-run` flag) that validates and logs without writing to the DB.
- npm script entry point: `npm run ingest:historical`.

**Out of scope:**
- Real-time / streaming ingestion (covered by REQ-001).
- UI for triggering or monitoring the job.
- Scheduling / cron setup (to be handled separately as an infrastructure task).
- Schema migrations — the `analytics_events` table already exists.
- Authentication changes.

## Data flow

```
Source data (CSV / external store)
       ↓
 ingest-historical-data.js
  - read records in batches
  - validate and sanitise each record
  - check for duplicates (SELECT before INSERT or ON CONFLICT DO NOTHING)
  - bulk INSERT into analytics_events via parameterised queries
  - log progress per batch
       ↓
 analytics_events table (PostgreSQL)
       ↓
 Existing analytics query API (REQ-002) — no changes needed
```

## Acceptance criteria

- [ ] **AC-1**: Given a CSV file with valid historical event records, when the job runs, then all records are inserted into `analytics_events` and the job logs the total count of records inserted.
- [ ] **AC-2**: Given a CSV file containing records that already exist in `analytics_events` (same `user_id`, `device_id`, `event_type`, `event_time`), when the job runs again, then no duplicate rows are created and the job logs the count of skipped records.
- [ ] **AC-3**: Given a batch of up to 100 records, when the job writes to the DB, then all 100 are written in a single transaction; if any record in the batch fails, the entire batch is rolled back and the error is logged.
- [ ] **AC-4**: Given the `--dry-run` flag, when the job runs, then no records are written to the DB and the job logs what would have been inserted.
- [ ] **AC-5**: Given a record with a missing or invalid field (`user_id`, `device_id`, `event_type`, or `event_time`), when the job processes it, then the record is skipped, an error is logged with the row number and reason, and processing continues.
- [ ] **AC-6**: Given the job completes, when checked, then a structured JSON summary log is emitted containing: `records_read`, `records_inserted`, `records_skipped`, `records_errored`, `duration_ms`.

## NFR checklist

- [ ] **Perf** — bulk inserts batched at 100 records per transaction (NFR-P4)
- [ ] **Security** — input validated and sanitised before DB use (NFR-S5)
- [ ] **Security** — no PII logged in plain text (NFR-S6)
- [ ] **Security** — parameterised SQL only; no string interpolation (NFR-S8)
- [ ] **Reliability** — each batch wrapped in a transaction with ROLLBACK on error (NFR-D1)
- [ ] **Reliability** — graceful degradation when DB is unavailable — job exits with non-zero code and logs error (NFR-R3)
- [ ] **Reliability** — consistent error logging format (NFR-R4)
- [ ] **Observability** — structured JSON summary log on completion (NFR-O1)
- [ ] **Data** — parameterised SQL only (NFR-S8)
- [ ] **Data** — no schema migration required — existing `analytics_events` table used as-is (NFR-D2 — N/A)
- [ ] **Data** — idempotent: ON CONFLICT DO NOTHING on unique key (`user_id`, `device_id`, `event_type`, `event_time`) (NFR-D1)

## Dependencies

- `analytics_events` table must exist (created by REQ-001).
- Connection pool from `src/db.js`.
- Source data format (CSV schema) to be confirmed by user before implementation.

## Open questions

- [ ] What is the source of the historical data — CSV file, S3 bucket, external database, or other?
- [ ] What is the expected volume — number of records to ingest?
- [ ] Should the job support multiple source file formats (CSV only, or also JSON/TSV)?
- [ ] Is there a specific time window for historical data (e.g. last 2 years only)?

## Decision log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-06-04 | Idempotent via ON CONFLICT DO NOTHING | Prevents duplicates on re-runs without needing a separate dedup step |
| 2026-06-04 | Batch size capped at 100 per NFR-P4 | Consistent with existing ingestion NFR |
