import { getAdEligibility, createAdContext } from "../src/ad-provider.js";
import { createFantasiaAiPacket } from "../src/ai-gateway.js";
import { validateEmergencyResource } from "../src/emergency-registry.js";
import { createIntegrationConfig, publicIntegrationStatus } from "../src/integration-config.js";
import { paymentLedgerType, verifyWebhookHmac } from "../src/payment-provider.js";

const rateBuckets = new Map();
const SAFETY_TERMS = ["not safe", "unsafe", "in danger", "violence", "abuse", "threat", "hurt me", "emergency", "siko salama", "hatari", "غير آمن", "خطر"];

function json(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": origin, "access-control-allow-headers": "content-type, idempotency-key, x-faithai-session, x-faithai-device, x-faithai-payment-signature", "access-control-allow-methods": "GET, POST, OPTIONS" } });
}

function text(value) { return String(value || "").trim(); }
function nowIso() { return new Date().toISOString(); }
function dayKey() { return nowIso().slice(0, 10); }
function monthKey() { return nowIso().slice(0, 7); }

async function hashText(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function rateAllowed(request) {
  const key = `${request.url}:${request.headers.get("x-faithai-session") || "anonymous"}`;
  const current = Date.now();
  const recent = (rateBuckets.get(key) || []).filter((time) => current - time < 60000);
  if (recent.length >= 60) return false;
  recent.push(current); rateBuckets.set(key, recent); return true;
}

async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 65536) throw new Error("request-too-large");
  return { raw, value: raw ? JSON.parse(raw) : {} };
}

async function all(db, statement, ...bindings) {
  if (!db) return [];
  const result = await db.prepare(statement).bind(...bindings).all();
  return result.results || [];
}

async function one(db, statement, ...bindings) {
  if (!db) return null;
  return db.prepare(statement).bind(...bindings).first();
}

async function requireDb(db) {
  if (!db) return json({ error: "d1-not-configured" }, 503);
  return null;
}

async function idempotent(db, request, callback) {
  const key = request.headers.get("idempotency-key");
  if (!key) return json({ error: "idempotency-key-required" }, 400);
  const endpoint = new URL(request.url).pathname;
  const existing = await one(db, "SELECT response_status, response_json FROM idempotency_keys WHERE idempotency_key = ? AND endpoint = ? AND expires_at > ?", key, endpoint, nowIso());
  if (existing) return new Response(existing.response_json, { status: existing.response_status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
  const result = await callback();
  const body = await result.clone().text();
  await db.prepare("INSERT INTO idempotency_keys (idempotency_key, endpoint, response_status, response_json, expires_at) VALUES (?, ?, ?, ?, ?)").bind(key, endpoint, result.status, body, new Date(Date.now() + 7 * 86400000).toISOString()).run();
  return result;
}

function safetyUtterance(value) {
  const normalized = text(value).toLocaleLowerCase();
  return SAFETY_TERMS.some((term) => normalized.includes(term));
}

async function reserveAiBudget(db, sessionKey, config) {
  const keys = [`ai:session:${sessionKey}`, `ai:day:${dayKey()}`, `ai:month:${monthKey()}`];
  const rows = await all(db, `SELECT budget_key, usage_usd, call_count FROM ai_budget WHERE budget_key IN (${keys.map(() => "?").join(",")})`, ...keys);
  const byKey = new Map(rows.map((row) => [row.budget_key, row]));
  const session = byKey.get(keys[0]) || { usage_usd: 0, call_count: 0 };
  const day = byKey.get(keys[1]) || { usage_usd: 0, call_count: 0 };
  const month = byKey.get(keys[2]) || { usage_usd: 0, call_count: 0 };
  const estimate = config.caps.estimatedAiCallUsd;
  if (session.call_count >= config.caps.maxRemoteCallsPerSession || Number(day.usage_usd) + estimate > config.caps.aiDailyUsd || Number(month.usage_usd) + estimate > config.caps.aiMonthlyUsd) return false;
  for (const key of keys) await db.prepare("INSERT INTO ai_budget (budget_key, usage_usd, call_count, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(budget_key) DO UPDATE SET usage_usd = usage_usd + excluded.usage_usd, call_count = call_count + 1, updated_at = excluded.updated_at").bind(key, estimate, nowIso()).run();
  return true;
}

async function handleAi(request, env, db, config, body) {
  if (Object.prototype.hasOwnProperty.call(body, "utterance") && !body.approvedUtterance) return json({ error: "approved-utterance-required" }, 400, env.FAITHAI_CORS_ORIGIN || "*");
  const approvedUtterance = text(body.approvedUtterance);
  if (body.consent !== true) return json({ ok: false, code: "consent-required", provenance: "local" }, 400, env.FAITHAI_CORS_ORIGIN || "*");
  if (!approvedUtterance) return json({ ok: false, code: "utterance-required", provenance: "local" }, 400, env.FAITHAI_CORS_ORIGIN || "*");
  if (safetyUtterance(approvedUtterance)) return json({ ok: false, code: "safety-local-only", provenance: "local" }, 503, env.FAITHAI_CORS_ORIGIN || "*");
  if (!config.providers.ai || !env.FAITHAI_AI_ENDPOINT || !env.FAITHAI_AI_API_KEY || !env.FAITHAI_AI_MODEL) return json({ ok: false, code: "remote-ai-disabled", provenance: "local" }, 503, env.FAITHAI_CORS_ORIGIN || "*");
  if (approvedUtterance.length > config.caps.maxRemoteChars) return json({ ok: false, code: "utterance-too-long", provenance: "local" }, 400, env.FAITHAI_CORS_ORIGIN || "*");
  if (!db) return json({ ok: false, code: "d1-not-configured", provenance: "local" }, 503, env.FAITHAI_CORS_ORIGIN || "*");
  const budgetReady = await reserveAiBudget(db, request.headers.get("x-faithai-session") || "anonymous", config);
  if (!budgetReady) return json({ ok: false, code: "ai-budget-exhausted", provenance: "local" }, 503, env.FAITHAI_CORS_ORIGIN || "*");
  try {
    const upstream = await fetch(env.FAITHAI_AI_ENDPOINT, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.FAITHAI_AI_API_KEY}` }, body: JSON.stringify({ model: env.FAITHAI_AI_MODEL, temperature: 0, messages: [{ role: "system", content: "Return only a safe intent, confidence, follow-up, and non-sensitive fields. Never make medical, legal, emergency, or eligibility decisions." }, { role: "user", content: approvedUtterance }], metadata: { locale: body.locale || "en", territory: body.territory || "global", scene: body.scene || "listen" } }) });
    if (!upstream.ok) throw new Error("upstream-failed");
    const result = await upstream.json();
    return json({ ok: true, intent: result.intent || null, confidence: Math.max(0, Math.min(1, Number(result.confidence || 0))), extracted: result.extracted && typeof result.extracted === "object" ? result.extracted : {}, followUp: text(result.followUp), provenance: "remote", requestId: body.requestId || "edge", packet: createFantasiaAiPacket({ requestId: body.requestId || "edge", locale: body.locale || "en", territory: body.territory || "global", scene: body.scene || "listen", consent: true }) }, 200, env.FAITHAI_CORS_ORIGIN || "*");
  } catch {
    return json({ ok: false, code: "remote-ai-unavailable", provenance: "local" }, 503, env.FAITHAI_CORS_ORIGIN || "*");
  }
}

async function handleApi(request, env) {
  const origin = env.FAITHAI_CORS_ORIGIN || "*";
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type, idempotency-key, x-faithai-session, x-faithai-device, x-faithai-payment-signature", "access-control-allow-methods": "GET, POST, OPTIONS" } });
  if (!rateAllowed(request)) return json({ error: "rate-limited", retryAfterSeconds: 60 }, 429, origin);
  const config = createIntegrationConfig(env);
  const db = env.DB;
  const url = new URL(request.url);
  const path = url.pathname;
  let body = {};
  let rawBody = "";
  if (request.method === "POST") {
    try { ({ raw: rawBody, value: body } = await readBody(request)); } catch (error) { return json({ error: error.message === "request-too-large" ? "request-too-large" : "invalid-request" }, error.message === "request-too-large" ? 413 : 400, origin); }
  }
  if (request.method === "GET" && path === "/v1/integrations/status") return json(publicIntegrationStatus(config), 200, origin);
  if (request.method === "POST" && path === "/v1/ads/contextual") {
    const context = createAdContext({ surface: body.surface, locale: body.locale, territory: body.territory, ageClass: body.ageClass });
    return json({ context, ...getAdEligibility(context), placement: null }, 200, origin);
  }
  if (request.method === "POST" && path === "/v1/ai/interpret") return handleAi(request, env, db, config, body);
  if (request.method === "GET" && path === "/v1/emergency/resources") {
    const missing = await requireDb(db); if (missing) return missing;
    if (!config.providers.emergency) return json({ resources: [], referralOnly: true, reason: "emergency-referrals-disabled" }, 200, origin);
    const territory = url.searchParams.get("territory") || "global";
    const locale = url.searchParams.get("locale") || "en";
    const resources = await all(db, "SELECT id, service, kind, territory, locale, phone_or_short_code, web_url, hours, available_channels, verification_date, expiration_date, source_organization, reviewers_json, status FROM emergency_resources WHERE status = 'approved' AND expiration_date >= ? AND (territory = ? OR territory = 'global') AND (locale = ? OR locale = 'en') ORDER BY service", nowIso(), territory, locale);
    const reviewed = resources.map((record) => ({ id: record.id, service: record.service, kind: record.kind, territory: record.territory, locale: record.locale, phoneOrShortCode: record.phone_or_short_code, webUrl: record.web_url, hours: record.hours, availableChannels: JSON.parse(record.available_channels || "[]"), verificationDate: record.verification_date, expirationDate: record.expiration_date, sourceOrganization: record.source_organization, reviewers: JSON.parse(record.reviewers_json || "[]"), status: record.status })).filter((record) => validateEmergencyResource(record).valid);
    return json({ resources: reviewed, referralOnly: true }, 200, origin);
  }
  if (request.method === "GET" && path === "/v1/content/sources") {
    const missing = await requireDb(db); if (missing) return missing;
    const sources = await all(db, "SELECT id, name, base_url, license_policy, territories_json, locales_json FROM content_sources WHERE status = 'approved' ORDER BY name");
    return json({ sources: sources.map((source) => ({ id: source.id, name: source.name, baseUrl: source.base_url, licensePolicy: source.license_policy, territories: JSON.parse(source.territories_json || "[]"), locales: JSON.parse(source.locales_json || "[]") })) }, 200, origin);
  }
  if (request.method === "GET" && path === "/v1/packs") {
    const missing = await requireDb(db); if (missing) return missing;
    const packs = await all(db, "SELECT id, kind, locale, territory, version, license, attribution, sources_json, reviewers_json, checksum, byte_size, publication_date, expires_at, object_key, signature, status FROM content_packs WHERE status = 'approved' AND expires_at >= ? AND (? = '' OR kind = ?) AND (? = '' OR locale = ?) ORDER BY kind, id", nowIso(), url.searchParams.get("kind") || "", url.searchParams.get("kind") || "", url.searchParams.get("locale") || "", url.searchParams.get("locale") || "");
    return json({ packs: packs.map((pack) => ({ id: pack.id, kind: pack.kind, locale: pack.locale, territory: pack.territory, version: pack.version, license: pack.license, attribution: pack.attribution, sources: JSON.parse(pack.sources_json || "[]"), reviewers: JSON.parse(pack.reviewers_json || "[]"), checksum: pack.checksum, size: pack.byte_size, publicationDate: pack.publication_date, expiration: pack.expires_at, objectKey: pack.object_key, signature: pack.signature, status: pack.status })), prototype: false }, 200, origin);
  }
  if (request.method === "GET" && path === "/v1/resources") {
    const missing = await requireDb(db); if (missing) return missing;
    const records = await all(db, "SELECT id, topic, territory, source_organization, eligibility_text, delivery_channel, verification_date, expires_at, steward_status, source_url FROM resources WHERE steward_status = 'approved' AND expires_at >= ? ORDER BY topic, id", nowIso());
    return json({ records: records.map((record) => ({ id: record.id, topic: record.topic, territory: record.territory, sourceOrganization: record.source_organization, eligibilityText: record.eligibility_text, deliveryChannel: record.delivery_channel, verificationDate: record.verification_date, expiration: record.expires_at, stewardStatus: record.steward_status, sourceUrl: record.source_url })), prototype: false }, 200, origin);
  }
  if (request.method === "GET" && path === "/v1/signals") {
    const missing = await requireDb(db); if (missing) return missing;
    const territory = url.searchParams.get("territory") || "global";
    const signals = await all(db, "SELECT id, source, reason, category, territory, urgency, valid_from, valid_until, permitted_channels FROM signals WHERE valid_from <= ? AND valid_until >= ? AND (territory = ? OR territory = 'global') ORDER BY CASE urgency WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END, valid_until", nowIso(), nowIso(), territory);
    return json({ signals: signals.map((signal) => ({ id: signal.id, source: signal.source, reason: signal.reason, category: signal.category, territory: signal.territory, urgency: signal.urgency, validFrom: signal.valid_from, validUntil: signal.valid_until, permittedChannels: JSON.parse(signal.permitted_channels || "[]") })) }, 200, origin);
  }
  if (request.method === "POST" && path === "/v1/circles/join") {
    const missing = await requireDb(db); if (missing) return missing;
    const codeHash = await hashText(text(body.code).toUpperCase().replace(/[^A-Z0-9]/g, ""));
    const circle = await one(db, "SELECT id, invitation_scope, locale, territory, moderation_state, revoked_at FROM circles WHERE invitation_code_hash = ? AND revoked_at IS NULL", codeHash);
    return circle ? json({ circle: { id: circle.id, codeHash, invitationScope: circle.invitation_scope, locale: circle.locale, territory: circle.territory, moderationState: circle.moderation_state, revokedAt: circle.revoked_at }, nicknameStored: false }, 200, origin) : json({ error: "invitation-unavailable" }, 404, origin);
  }
  if (request.method === "GET" && path === "/v1/challenges") {
    const missing = await requireDb(db); if (missing) return missing;
    const circle = url.searchParams.get("circle"); if (!circle) return json({ error: "circle-scope-required" }, 400, origin);
    const challenges = await all(db, "SELECT id, circle_id, approved_template, title, action_text, starts_at, ends_at, cooperative_goal, moderation_state FROM challenges WHERE circle_id = ? AND moderation_state = 'approved' AND ends_at >= ? ORDER BY starts_at", circle, nowIso());
    return json({ challenges: challenges.map((item) => ({ id: item.id, circleId: item.circle_id, approvedTemplate: item.approved_template, title: item.title, actionText: item.action_text, start: item.starts_at, end: item.ends_at, cooperativeGoal: item.cooperative_goal, moderationState: item.moderation_state })) }, 200, origin);
  }
  if (request.method === "POST" && path === "/v1/progress") {
    const missing = await requireDb(db); if (missing) return missing;
    return idempotent(db, request, async () => {
      if (!["done", "need_help", "later"].includes(body.response)) return json({ error: "invalid-progress" }, 400, origin);
      const challenge = await one(db, "SELECT circle_id FROM challenges WHERE id = ?", body.challengeId);
      if (!challenge) return json({ error: "challenge-not-found" }, 404, origin);
      const deviceHash = await hashText(request.headers.get("x-faithai-device") || request.headers.get("x-faithai-session") || "anonymous");
      await db.prepare("INSERT INTO challenge_progress (challenge_id, circle_id, device_pseudonym_hash, response, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(challenge_id, device_pseudonym_hash) DO UPDATE SET response = excluded.response, updated_at = excluded.updated_at").bind(body.challengeId, challenge.circle_id, deviceHash, body.response, nowIso()).run();
      return json({ accepted: true, response: body.response }, 202, origin);
    });
  }
  if (request.method === "POST" && path === "/v1/sync/events") {
    const missing = await requireDb(db); if (missing) return missing;
    if (String(body.type || "").toLowerCase().includes("safety") || body.sensitive === true) return json({ error: "sensitive-event-not-synced" }, 400, origin);
    return idempotent(db, request, async () => {
      const eventId = crypto.randomUUID();
      await db.prepare("INSERT INTO sync_events (id, event_type, payload_json, received_at) VALUES (?, ?, ?, ?)").bind(eventId, body.type || "unknown", JSON.stringify(body.payload || {}), nowIso()).run();
      if (env.OUTBOX) await env.OUTBOX.send({ eventId, type: body.type || "unknown" });
      return json({ accepted: true, eventId }, 202, origin);
    });
  }
  if (request.method === "POST" && path === "/v1/power-credits") {
    const missing = await requireDb(db); if (missing) return missing;
    if (body.cashAmount || (!body.donatedResource && !body.request)) return json({ error: "noncash-resource-or-request-required" }, 400, origin);
    return idempotent(db, request, async () => {
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO power_credit_records (id, donated_resource, restrictions, request_text, receipt_json, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, body.donatedResource || null, body.restrictions || null, body.request || null, JSON.stringify({ receipt: "noncash-review-required" }), nowIso()).run();
      return json({ id, donatedResource: body.donatedResource || null, restrictions: body.restrictions || null, request: body.request || null, reviewer: null, allocation: null, receipt: "noncash-review-required" }, 201, origin);
    });
  }
  if (request.method === "POST" && path === "/v1/payments/create-link") {
    const missing = await requireDb(db); if (missing) return missing;
    const provider = String(body.provider || "").toLowerCase();
    const purpose = String(body.purpose || "").toLowerCase();
    const validProvider = ["stripe", "paystack", "flutterwave"].includes(provider);
    const validPurpose = ["donation", "sponsor", "partner-fee"].includes(purpose);
    if (!validProvider || !validPurpose || !Number.isInteger(body.amountMinor) || body.amountMinor <= 0 || !/^[A-Z]{3}$/.test(String(body.currency || ""))) return json({ created: false, code: "invalid-payment-intent" }, 400, origin);
    const linkKey = `FAITHAI_${provider.toUpperCase()}_${purpose.toUpperCase().replace(/-/g, "_")}_LINK`;
    if (!config.providers[provider] || !env[linkKey]) return json({ created: false, code: "payment-adapter-disabled" }, 503, origin);
    return idempotent(db, request, async () => json({ created: true, provider, url: env[linkKey], externalId: null, ledgerType: purpose === "donation" ? "restricted" : "earned" }, 201, origin));
  }
  if (request.method === "POST" && path === "/v1/payments/webhook") {
    const missing = await requireDb(db); if (missing) return missing;
    if (!env.FAITHAI_PAYMENT_WEBHOOK_SECRET) return json({ accepted: false, code: "payment-webhook-disabled" }, 503, origin);
    if (!["donation", "sponsor", "partner-fee"].includes(String(body.purpose || "").toLowerCase())) return json({ accepted: false, code: "invalid-payment-purpose" }, 400, origin);
    if (!Number.isInteger(body.amountMinor) || body.amountMinor <= 0 || !/^[A-Z]{3}$/.test(String(body.currency || ""))) return json({ accepted: false, code: "invalid-payment-amount" }, 400, origin);
    if (!(await verifyWebhookHmac(rawBody, request.headers.get("x-faithai-payment-signature"), env.FAITHAI_PAYMENT_WEBHOOK_SECRET))) return json({ accepted: false, code: "invalid-payment-signature" }, 401, origin);
    return idempotent(db, request, async () => {
      const id = crypto.randomUUID();
      await db.prepare("INSERT INTO revenue_ledger (id, ledger_type, amount_minor, currency, source, restrictions, hosted_payment_receipt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id, paymentLedgerType(body.purpose), Number(body.amountMinor || 0), String(body.currency || "USD"), providerName(body.provider), body.restrictions || null, body.externalId || null, nowIso()).run();
      return json({ accepted: true, ledgerType: paymentLedgerType(body.purpose), externalId: body.externalId || null }, 202, origin);
    });
  }
  return json({ error: "not-found" }, 404, origin);
}

function providerName(value) { return ["stripe", "paystack", "flutterwave"].includes(String(value || "").toLowerCase()) ? String(value).toLowerCase() : "hosted-payment"; }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/v1/")) return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
