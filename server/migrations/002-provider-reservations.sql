-- Conservative maximum-cost reservations. No utterances or journey data stored.
CREATE TABLE IF NOT EXISTS ai_budget_periods (
  period text PRIMARY KEY,
  reserved_usd numeric(14,6) NOT NULL CHECK (reserved_usd >= 0)
);
CREATE TABLE IF NOT EXISTS ai_budget_sessions (
  session_hash text NOT NULL,
  day date NOT NULL,
  calls integer NOT NULL CHECK (calls >= 0),
  PRIMARY KEY (session_hash, day)
);
