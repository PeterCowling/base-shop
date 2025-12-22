-- Logistics lanes + quote basket profiles (3PL decision support)

CREATE TABLE IF NOT EXISTS logistics_lanes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  destination_type TEXT,
  incoterm TEXT,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_logistics_lanes_model ON logistics_lanes(model);
CREATE INDEX IF NOT EXISTS idx_logistics_lanes_active ON logistics_lanes(active);

CREATE TABLE IF NOT EXISTS lane_versions (
  id TEXT PRIMARY KEY,
  lane_id TEXT NOT NULL,
  version_label TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  confidence TEXT NOT NULL,
  expires_at TEXT,
  currency TEXT NOT NULL,
  source_currency TEXT,
  fx_rate REAL,
  fx_date TEXT,
  fx_source TEXT,
  lead_time_low_days INTEGER,
  lead_time_base_days INTEGER,
  lead_time_high_days INTEGER,
  cost_basis TEXT,
  cost_amount REAL,
  cost_minimum REAL,
  included_notes TEXT,
  excluded_notes TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lane_id) REFERENCES logistics_lanes(id)
);

CREATE INDEX IF NOT EXISTS idx_lane_versions_lane
  ON lane_versions(lane_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lane_versions_status
  ON lane_versions(status);
CREATE INDEX IF NOT EXISTS idx_lane_versions_expires
  ON lane_versions(expires_at);

CREATE TABLE IF NOT EXISTS quote_basket_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  profile_type TEXT,
  origin TEXT,
  destination TEXT,
  destination_type TEXT,
  incoterm TEXT,
  carton_count INTEGER,
  units_per_carton INTEGER,
  weight_kg REAL,
  cbm REAL,
  dimensions_cm TEXT,
  hazmat_flag INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_quote_basket_profiles_type
  ON quote_basket_profiles(profile_type);

CREATE TRIGGER IF NOT EXISTS audit_logistics_lanes_insert
AFTER INSERT ON logistics_lanes
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'logistics_lane',
    NEW.id,
    'logistics_lane.created',
    json_object(
      'name', NEW.name,
      'model', NEW.model,
      'origin', NEW.origin,
      'destination', NEW.destination,
      'destination_type', NEW.destination_type,
      'incoterm', NEW.incoterm,
      'active', NEW.active
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_logistics_lanes_update
AFTER UPDATE ON logistics_lanes
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'logistics_lane',
    NEW.id,
    'logistics_lane.updated',
    json_object(
      'name', NEW.name,
      'model', NEW.model,
      'origin', NEW.origin,
      'destination', NEW.destination,
      'destination_type', NEW.destination_type,
      'incoterm', NEW.incoterm,
      'active', NEW.active
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_lane_versions_insert
AFTER INSERT ON lane_versions
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lane_version',
    NEW.id,
    'lane_version.created',
    json_object(
      'lane_id', NEW.lane_id,
      'status', NEW.status,
      'confidence', NEW.confidence,
      'expires_at', NEW.expires_at,
      'currency', NEW.currency,
      'cost_basis', NEW.cost_basis,
      'cost_amount', NEW.cost_amount,
      'lead_time_base_days', NEW.lead_time_base_days
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_lane_versions_update
AFTER UPDATE ON lane_versions
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'lane_version',
    NEW.id,
    'lane_version.updated',
    json_object(
      'lane_id', NEW.lane_id,
      'status', NEW.status,
      'confidence', NEW.confidence,
      'expires_at', NEW.expires_at,
      'currency', NEW.currency,
      'cost_basis', NEW.cost_basis,
      'cost_amount', NEW.cost_amount,
      'lead_time_base_days', NEW.lead_time_base_days
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_quote_basket_profiles_insert
AFTER INSERT ON quote_basket_profiles
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'quote_basket_profile',
    NEW.id,
    'quote_basket_profile.created',
    json_object(
      'name', NEW.name,
      'profile_type', NEW.profile_type,
      'destination_type', NEW.destination_type,
      'hazmat_flag', NEW.hazmat_flag
    ),
    datetime('now')
  );
END;

CREATE TRIGGER IF NOT EXISTS audit_quote_basket_profiles_update
AFTER UPDATE ON quote_basket_profiles
BEGIN
  INSERT INTO audit_logs (id, entity_type, entity_id, action, details_json, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    'quote_basket_profile',
    NEW.id,
    'quote_basket_profile.updated',
    json_object(
      'name', NEW.name,
      'profile_type', NEW.profile_type,
      'destination_type', NEW.destination_type,
      'hazmat_flag', NEW.hazmat_flag
    ),
    datetime('now')
  );
END;
