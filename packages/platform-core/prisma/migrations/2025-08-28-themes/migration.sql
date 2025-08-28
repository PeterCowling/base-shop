-- Create theme library table
CREATE TABLE "ThemeLibrary" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "brandColor" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}'
);
