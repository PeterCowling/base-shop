-- Index on (event_type, timestamp) for analytics queries that filter by event type.

CREATE INDEX IF NOT EXISTS idx_thread_events_event_type_time
  ON thread_events(event_type, timestamp);
