-- Front Door Worker: hostname → shop mapping store

CREATE TABLE IF NOT EXISTS host_mappings (
  host TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  canonical_host TEXT NOT NULL,
  default_locale TEXT NOT NULL,
  mode TEXT NOT NULL,
  redirect_to TEXT,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_host_mappings_shop_id ON host_mappings(shop_id);
CREATE INDEX IF NOT EXISTS idx_host_mappings_canonical_host ON host_mappings(canonical_host);

