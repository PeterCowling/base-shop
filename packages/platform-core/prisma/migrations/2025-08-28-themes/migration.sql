-- packages/platform-core/prisma/migrations/2025-08-28-themes/migration.sql
CREATE TABLE IF NOT EXISTS "ThemeLibrary" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "brandColor" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "data" JSONB NOT NULL DEFAULT '{}'
);
