import pg from "pg";
import { createHash } from "node:crypto";
import { validateEmergencyResource } from "../src/emergency-registry.js";

const { Pool } = pg;

function asDate(value) { return value instanceof Date ? value.toISOString() : new Date(value).toISOString(); }
function normalizeJson(value, fallback) { return value && typeof value === "object" ? value : fallback; }

export function createPostgresPool(env = process.env) {
  if (!env.DATABASE_URL) return null;
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: Math.max(1, Math.min(20, Number(env.FAITHAI_DB_POOL_MAX || 5))),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: String(env.FAITHAI_DB_SSL || "false").toLowerCase() === "true" ? { rejectUnauthorized: true } : false,
  });
}

export function createPostgresStore(pool) {
  if (!pool) return null;
  return {
    async close() { await pool.end(); },
    async runIdempotent(key, endpoint, create) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`faithai:idempotency:${key}`]);
        const transactionStore = createPostgresStore(client);
        const existing = await transactionStore.getIdempotency(key, endpoint);
        if (existing) { await client.query("COMMIT"); return existing; }
        const result = await create(transactionStore);
        await transactionStore.putIdempotency(key, endpoint, result, new Date(Date.now() + 7 * 86400000));
        await client.query("COMMIT");
        return result;
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
    async reserveAiBudget({ sessionKey, estimatedCostUsd, caps, now = Date.now() }) {
      if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd <= 0) return false;
      const day = new Date(now).toISOString().slice(0, 10);
      const month = day.slice(0, 7);
      const session = createHash("sha256").update(String(sessionKey)).digest("hex");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext('faithai:ai-budget'))");
        const daily = await client.query("SELECT reserved_usd FROM ai_budget_periods WHERE period = $1", [`day:${day}`]);
        const monthly = await client.query("SELECT reserved_usd FROM ai_budget_periods WHERE period = $1", [`month:${month}`]);
        const calls = await client.query("SELECT calls FROM ai_budget_sessions WHERE session_hash = $1 AND day = $2", [session, day]);
        if (Number(daily.rows[0]?.reserved_usd || 0) + estimatedCostUsd > caps.aiDailyUsd || Number(monthly.rows[0]?.reserved_usd || 0) + estimatedCostUsd > caps.aiMonthlyUsd || Number(calls.rows[0]?.calls || 0) >= caps.maxRemoteCallsPerSession) { await client.query("ROLLBACK"); return false; }
        for (const period of [`day:${day}`, `month:${month}`]) await client.query("INSERT INTO ai_budget_periods (period, reserved_usd) VALUES ($1, $2) ON CONFLICT (period) DO UPDATE SET reserved_usd = ai_budget_periods.reserved_usd + EXCLUDED.reserved_usd", [period, estimatedCostUsd]);
        await client.query("INSERT INTO ai_budget_sessions (session_hash, day, calls) VALUES ($1, $2, 1) ON CONFLICT (session_hash, day) DO UPDATE SET calls = ai_budget_sessions.calls + 1", [session, day]);
        await client.query("COMMIT");
        return true;
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
    async health() {
      const result = await pool.query("SELECT current_database() AS database, now() AS checked_at");
      return { ok: true, database: result.rows[0].database, checkedAt: result.rows[0].checked_at };
    },
    async getIdempotency(key, endpoint, now = new Date()) {
      const result = await pool.query("SELECT response_status, response_body FROM idempotency_keys WHERE key = $1 AND endpoint = $2 AND expires_at > $3", [key, endpoint, asDate(now)]);
      return result.rows[0] ? { status: result.rows[0].response_status, body: result.rows[0].response_body } : null;
    },
    async putIdempotency(key, endpoint, result, expiresAt) {
      await pool.query("INSERT INTO idempotency_keys (key, endpoint, response_status, response_body, expires_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (key) DO UPDATE SET endpoint = EXCLUDED.endpoint, response_status = EXCLUDED.response_status, response_body = EXCLUDED.response_body, expires_at = EXCLUDED.expires_at", [key, endpoint, result.status, JSON.stringify(result.body), asDate(expiresAt)]);
    },
    async listPacks({ kind = null, locale = null, now = new Date() } = {}) {
      const result = await pool.query("SELECT id, kind, locale, territory, version, license, attribution, sources, reviewers, checksum, byte_size, publication_date, expires_at, object_key, signature, status FROM content_packs WHERE status = 'approved' AND expires_at >= $1 AND ($2::text IS NULL OR kind = $2) AND ($3::text IS NULL OR locale = $3) ORDER BY kind, id", [asDate(now), kind, locale]);
      return result.rows.map((pack) => ({ ...pack, byteSize: Number(pack.byte_size), publicationDate: pack.publication_date, expiration: pack.expires_at, objectKey: pack.object_key }));
    },
    async listResources({ now = new Date() } = {}) {
      const result = await pool.query("SELECT id, topic, territory, source_organization, eligibility_text, delivery_channel, verification_date, expires_at, steward_status, source_url FROM resources WHERE steward_status = 'approved' AND expires_at >= $1 ORDER BY topic, id", [asDate(now)]);
      return result.rows.map((record) => ({ id: record.id, topic: record.topic, territory: record.territory, sourceOrganization: record.source_organization, eligibilityText: record.eligibility_text, deliveryChannel: record.delivery_channel, verificationDate: record.verification_date, expiration: record.expires_at, stewardStatus: record.steward_status, sourceUrl: record.source_url }));
    },
    async listEmergencyResources({ territory = "global", locale = "en", now = new Date() } = {}) {
      const result = await pool.query("SELECT id, service, kind, territory, locale, phone_or_short_code, web_url, hours, available_channels, verification_date, expiration_date, source_organization, reviewers, status FROM emergency_resources WHERE status = 'approved' AND expiration_date >= $1 AND (territory = $2 OR territory = 'global') AND (locale = $3 OR locale = 'en') ORDER BY service", [asDate(now), territory, locale]);
      return result.rows.map((record) => ({ id: record.id, service: record.service, kind: record.kind, territory: record.territory, locale: record.locale, phoneOrShortCode: record.phone_or_short_code, webUrl: record.web_url, hours: record.hours, availableChannels: record.available_channels || [], verificationDate: record.verification_date, expirationDate: record.expiration_date, sourceOrganization: record.source_organization, reviewers: normalizeJson(record.reviewers, []), status: record.status })).filter((record) => validateEmergencyResource(record).valid);
    },
    async listContentSources() {
      const result = await pool.query("SELECT id, name, territories, locales, license_policy FROM content_sources WHERE status = 'approved' ORDER BY name");
      return result.rows.map((source) => ({ id: source.id, name: source.name, territories: source.territories, locales: source.locales, licensePolicy: source.license_policy }));
    },
    async saveSyncEvent(event, idempotencyKey) {
      const result = await pool.query("INSERT INTO sync_events (event_type, payload, received_at) VALUES ($1, $2, $3) RETURNING id", [event.type, JSON.stringify(normalizeJson(event.payload, {})), event.receivedAt]);
      if (idempotencyKey) await pool.query("INSERT INTO outbox_events (idempotency_key, topic, payload) VALUES ($1, $2, $3) ON CONFLICT (idempotency_key) DO NOTHING", [idempotencyKey, event.type, JSON.stringify({ eventId: String(result.rows[0].id), ...normalizeJson(event.payload, {}) })]);
      return String(result.rows[0].id);
    },
    async savePowerCredit(record) {
      const result = await pool.query("INSERT INTO power_credit_records (donated_resource, restrictions, request_text, receipt) VALUES ($1, $2, $3, $4) RETURNING id", [record.donatedResource, record.restrictions, record.request, JSON.stringify({ status: record.receipt })]);
      return String(result.rows[0].id);
    },
    async recordRevenue(record) {
      const result = await pool.query("INSERT INTO revenue_ledger (ledger_type, amount_minor, currency, source, restrictions, hosted_payment_receipt) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", [record.ledgerType, record.amountMinor, record.currency, record.source, record.restrictions, record.externalId]);
      return String(result.rows[0].id);
    },
    async syncProviderStatus(providers, territories = ["global"]) {
      for (const [provider, enabled] of Object.entries(providers)) {
        for (const territory of territories) {
          await pool.query("INSERT INTO provider_status (provider, territory, enabled, status, updated_at) VALUES ($1, $2, $3, $4, now()) ON CONFLICT (provider, territory) DO UPDATE SET enabled = EXCLUDED.enabled, status = EXCLUDED.status, updated_at = now()", [provider, territory, Boolean(enabled), enabled ? "configured" : "disabled"]);
        }
      }
    },
    async providerStatus() {
      const result = await pool.query("SELECT provider, territory, enabled, status, updated_at FROM provider_status ORDER BY provider, territory");
      return result.rows.map((record) => ({ provider: record.provider, territory: record.territory, enabled: record.enabled, status: record.status, updatedAt: record.updated_at }));
    },
  };
}
