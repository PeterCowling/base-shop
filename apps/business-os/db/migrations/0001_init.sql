-- Business OS D1 schema (initial)
-- Based on types in apps/business-os/src/lib/types.ts
-- Pattern follows apps/product-pipeline/db/migrations/0001_init.sql

-- Cards table
-- Stores all Business OS cards with indexed query columns + JSON payload
CREATE TABLE IF NOT EXISTS business_os_cards (
  id TEXT PRIMARY KEY,                    -- Card ID (e.g., "BRIK-ENG-0001")
  business TEXT,                          -- Business code (e.g., "BRIK")
  lane TEXT NOT NULL,                     -- Lane: Inbox|Fact-finding|Planned|In progress|Blocked|Done|Reflected
  priority TEXT NOT NULL DEFAULT 'P3',    -- Priority: P0|P1|P2|P3|P4|P5
  owner TEXT NOT NULL,                    -- Owner name
  title TEXT,                             -- Card title (extracted for queries)
  payload_json TEXT NOT NULL,             -- Full card data as JSON (CardFrontmatter + content)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ideas table
-- Stores inbox and worked ideas
CREATE TABLE IF NOT EXISTS business_os_ideas (
  id TEXT PRIMARY KEY,                    -- Idea ID (generated or from frontmatter)
  business TEXT,                          -- Business code
  status TEXT DEFAULT 'raw',              -- Status: raw|worked|converted|dropped
  location TEXT DEFAULT 'inbox',          -- Location: inbox|worked
  payload_json TEXT NOT NULL,             -- Full idea data as JSON (IdeaFrontmatter + content)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stage documents table
-- Stores fact-find, plan, build, reflect docs for cards
CREATE TABLE IF NOT EXISTS business_os_stage_docs (
  id TEXT PRIMARY KEY,                    -- Generated ID (UUID or sequential)
  card_id TEXT NOT NULL,                  -- Parent card ID
  stage TEXT NOT NULL,                    -- Stage type: fact-find|plan|build|reflect
  payload_json TEXT NOT NULL,             -- Full stage doc data as JSON (StageFrontmatter + content)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES business_os_cards(id)
);

-- Comments table (optional, for future use)
-- Stores file-per-comment data
CREATE TABLE IF NOT EXISTS business_os_comments (
  id TEXT PRIMARY KEY,                    -- Comment ID (UUID or timestamp-based)
  card_id TEXT NOT NULL,                  -- Parent card ID
  author TEXT NOT NULL,                   -- Comment author
  content TEXT NOT NULL,                  -- Comment body (markdown)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES business_os_cards(id)
);

-- Audit log table
-- Tracks all mutations for audit trail (complements git mirror)
CREATE TABLE IF NOT EXISTS business_os_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,   -- Sequential audit log ID
  entity_type TEXT NOT NULL,              -- Entity type: card|idea|stage_doc|comment
  entity_id TEXT NOT NULL,                -- Entity ID
  action TEXT NOT NULL,                   -- Action: create|update|delete|move
  actor TEXT NOT NULL,                    -- User who performed action
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  changes_json TEXT                       -- JSON snapshot of changes (optional)
);

-- Metadata table (for system state tracking)
CREATE TABLE IF NOT EXISTS business_os_metadata (
  key TEXT PRIMARY KEY,                   -- Metadata key (e.g., "last_git_export_at")
  value TEXT,                             -- Metadata value (JSON or scalar)
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for board queries (critical for performance)
-- Multi-column index for board filtering (business + lane + priority + updated)
CREATE INDEX IF NOT EXISTS idx_cards_board_query
  ON business_os_cards(business, lane, priority, updated_at);

-- Index for global board (P0/P1 across all businesses)
CREATE INDEX IF NOT EXISTS idx_cards_global_priority
  ON business_os_cards(priority, updated_at);

-- Index for version endpoint (MAX(updated_at) query)
CREATE INDEX IF NOT EXISTS idx_cards_updated_at
  ON business_os_cards(updated_at);

-- Index for ideas inbox listing
CREATE INDEX IF NOT EXISTS idx_ideas_inbox
  ON business_os_ideas(business, status, created_at);

-- Index for stage docs by card
CREATE INDEX IF NOT EXISTS idx_stage_docs_card
  ON business_os_stage_docs(card_id, stage);

-- Index for comments by card
CREATE INDEX IF NOT EXISTS idx_comments_card
  ON business_os_comments(card_id, created_at);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON business_os_audit_log(entity_type, entity_id, timestamp);
