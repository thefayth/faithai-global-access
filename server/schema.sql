-- Portable PostgreSQL baseline. Apply through a reviewed migration tool in a governed pilot.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS content_packs (
  id text PRIMARY KEY,
  kind text NOT NULL,
  locale text NOT NULL,
  territory text NOT NULL,
  version text NOT NULL,
  license text NOT NULL,
  attribution text NOT NULL,
  sources jsonb NOT NULL,
  reviewers jsonb NOT NULL,
  checksum text NOT NULL,
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  publication_date date NOT NULL,
  expires_at timestamptz NOT NULL,
  object_key text NOT NULL,
  signature text NOT NULL,
  status text NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  territory text NOT NULL,
  source_organization text NOT NULL,
  eligibility_text text NOT NULL,
  delivery_channel text NOT NULL,
  verification_date date NOT NULL,
  expires_at timestamptz NOT NULL,
  steward_status text NOT NULL CHECK (steward_status IN ('prototype', 'approved', 'expired', 'withdrawn')),
  source_url text NOT NULL
);

CREATE TABLE IF NOT EXISTS circles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code_hash text UNIQUE NOT NULL,
  invitation_scope text NOT NULL,
  locale text NOT NULL,
  territory text NOT NULL,
  moderation_state text NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id uuid NOT NULL REFERENCES circles(id),
  approved_template text NOT NULL,
  title text NOT NULL,
  action_text text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  cooperative_goal integer,
  moderation_state text NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  circle_id uuid NOT NULL REFERENCES circles(id),
  challenge_id uuid NOT NULL REFERENCES challenges(id),
  device_pseudonym_hash text NOT NULL,
  response text NOT NULL CHECK (response IN ('done', 'need_help', 'later')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_id, device_pseudonym_hash)
);

CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  reason text NOT NULL,
  category text NOT NULL,
  territory text NOT NULL,
  urgency text NOT NULL CHECK (urgency IN ('routine', 'important', 'urgent')),
  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,
  permitted_channels text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS power_credit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donated_resource text,
  restrictions text,
  request_text text,
  reviewer_subject text,
  allocation text,
  receipt jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (donated_resource IS NOT NULL OR request_text IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_type text NOT NULL CHECK (ledger_type IN ('earned', 'restricted')),
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  source text NOT NULL,
  restrictions text,
  hosted_payment_receipt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS steward_roles (
  oidc_subject text NOT NULL,
  role text NOT NULL CHECK (role IN ('reviewer', 'publisher', 'safeguarding_owner', 'administrator')),
  territory text NOT NULL,
  mfa_verified_at timestamptz NOT NULL,
  PRIMARY KEY (oidc_subject, role, territory)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  key text PRIMARY KEY,
  endpoint text NOT NULL,
  response_status integer NOT NULL,
  response_body jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text UNIQUE NOT NULL,
  topic text NOT NULL,
  payload jsonb NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  dead_lettered_at timestamptz,
  last_error text
);

CREATE TABLE IF NOT EXISTS emergency_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  kind text NOT NULL,
  territory text NOT NULL,
  locale text NOT NULL,
  phone_or_short_code text,
  web_url text,
  hours text,
  available_channels text[] NOT NULL DEFAULT '{}',
  verification_date date NOT NULL,
  expiration_date timestamptz NOT NULL,
  source_organization text NOT NULL,
  reviewers jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn')),
  CHECK (phone_or_short_code IS NOT NULL OR web_url IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS content_sources (
  id text PRIMARY KEY,
  name text NOT NULL,
  base_url text NOT NULL,
  license_policy text NOT NULL,
  territories text[] NOT NULL,
  locales text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('prototype', 'approved', 'withdrawn')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_status (
  provider text NOT NULL,
  territory text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN ('disabled', 'configured', 'healthy', 'degraded', 'blocked')),
  detail text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, territory)
);

CREATE TABLE IF NOT EXISTS faithai_migrations (
  migration_id text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resources_active_lookup ON resources (territory, topic, expires_at) WHERE steward_status = 'approved';
CREATE INDEX IF NOT EXISTS signals_active_lookup ON signals (territory, valid_until);
CREATE INDEX IF NOT EXISTS emergency_active_lookup ON emergency_resources (territory, locale, expiration_date) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS outbox_ready_lookup ON outbox_events (available_at) WHERE processed_at IS NULL AND dead_lettered_at IS NULL;
