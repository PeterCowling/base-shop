-- Migration for theme library table
CREATE TABLE IF NOT EXISTS ThemeLibrary (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brandColor TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  theme JSON NOT NULL
);
