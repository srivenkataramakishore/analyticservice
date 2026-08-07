-- Migration: 001_create_analytics_events
-- KN-2: Data Service API for analytics
-- Creates the analytics_events table with indexes for efficient querying.

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  VARCHAR(100) NOT NULL,
  user_id     VARCHAR(100) NOT NULL,
  timestamp   TIMESTAMPTZ  NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index for time-range + event_type queries (used by GET /reports)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time
  ON analytics_events (event_type, timestamp);

-- Index for user-scoped queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user
  ON analytics_events (user_id);

-- Index for time-series aggregations
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
  ON analytics_events (timestamp);
