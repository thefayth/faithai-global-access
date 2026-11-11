CREATE TABLE IF NOT EXISTS content_packs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  locale TEXT NOT NULL,
  territory TEXT NOT NULL,
  version TEXT NOT NULL,
  license TEXT NOT NULL,
  attribution TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  reviewers_json TEXT NOT NULL,
  checksum TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  publication_date TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  object_key TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  territory TEXT NOT NULL,
  source_organization TEXT NOT NULL,
  eligibility_text TEXT NOT NULL,
  delivery_channel TEXT NOT NULL,
  verification_date TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  steward_status TEXT NOT NULL CHECK (steward_status IN ('prototype', 'approved', 'expired', 'withdrawn')),
  source_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  license_policy TEXT NOT NULL,
  territories_json TEXT NOT NULL,
  locales_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn'))
);

CREATE TABLE IF NOT EXISTS emergency_resources (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  kind TEXT NOT NULL,
  territory TEXT NOT NULL,
  locale TEXT NOT NULL,
  phone_or_short_code TEXT,
  web_url TEXT,
  hours TEXT,
  available_channels TEXT NOT NULL,
  verification_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  source_organization TEXT NOT NULL,
  reviewers_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn'))
);

CREATE TABLE IF NOT EXISTS circles (
  id TEXT PRIMARY KEY,
  invitation_code_hash TEXT UNIQUE NOT NULL,
  invitation_scope TEXT NOT NULL,
  locale TEXT NOT NULL,
  territory TEXT NOT NULL,
  moderation_state TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL,
  approved_template TEXT NOT NULL,
  title TEXT NOT NULL,
  action_text TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  cooperative_goal INTEGER,
  moderation_state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  challenge_id TEXT NOT NULL,
  circle_id TEXT NOT NULL,
  device_pseudonym_hash TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('done', 'need_help', 'later')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (challenge_id, device_pseudonym_hash)
);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL,
  territory TEXT NOT NULL,
  urgency TEXT NOT NULL CHECK (urgency IN ('routine', 'important', 'urgent')),
  valid_from TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  permitted_channels TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (idempotency_key, endpoint)
);

CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS power_credit_records (
  id TEXT PRIMARY KEY,
  donated_resource TEXT,
  restrictions TEXT,
  request_text TEXT,
  receipt_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (donated_resource IS NOT NULL OR request_text IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS revenue_ledger (
  id TEXT PRIMARY KEY,
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('earned', 'restricted')),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  source TEXT NOT NULL,
  restrictions TEXT,
  hosted_payment_receipt TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_budget (
  budget_key TEXT PRIMARY KEY,
  usage_usd REAL NOT NULL DEFAULT 0,
  call_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS packs_fresh_lookup ON content_packs (status, expires_at, kind, locale);
CREATE INDEX IF NOT EXISTS resources_fresh_lookup ON resources (steward_status, expires_at, topic);
CREATE INDEX IF NOT EXISTS emergency_fresh_lookup ON emergency_resources (status, expiration_date, territory, locale);
CREATE INDEX IF NOT EXISTS signals_fresh_lookup ON signals (valid_from, valid_until, territory);
