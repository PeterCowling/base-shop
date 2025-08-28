-- packages/platform-core/prisma/migrations/2025-08-28-themes/migration.sql
-- Placeholder migration creating theme_library table

CREATE TABLE IF NOT EXISTS theme_library (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_color TEXT NOT NULL,
  created_by TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  tokens JSON
);
