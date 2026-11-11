import { getAdEligibility, createAdContext } from "../src/ad-provider.js";
import { CHALLENGES, joinPrototypeCircle, recordChallengeProgress } from "../src/challenge-engine.js";
import { CONTENT_PACKS, isPackFresh } from "../src/help-content.js";
import { createAiGateway } from "../src/ai-gateway.js";
import { createIntegrationConfig, publicIntegrationStatus } from "../src/integration-config.js";
import { listEmergencyResources } from "../src/emergency-registry.js";
import { paymentLedgerType } from "../src/payment-provider.js";

const ROUTES = new Set(["/healthz", "/v1/packs", "/v1/resources", "/v1/circles/join", "/v1/challenges", "/v1/progress", "/v1/signals", "/v1/ads/contextual", "/v1/sync/events", "/v1/power-credits", "/v1/integrations/status", "/v1/ai/interpret", "/v1/emergency/resources", "/v1/content/sources", "/v1/payments/create-link", "/v1/payments/webhook"]);
const PUBLIC_WRITE_ROUTES = new Set(["/v1/sync/events", "/v1/power-credits", "/v1/circles/join", "/v1/progress"]);

export function createApiState({ env = {}, emergencyResources = [], contentSources = [], aiProvider = null, paymentAdapters = {}, paymentWebhookVerifier = null, paymentEventMapper = null, configured = null, maxCallUsd = null, store = null, databaseRequired = false } = {}) {
  const config = createIntegrationConfig(env);
  const production = env.NODE_ENV === "production" || ["production", "public", "vps"].includes(String(config.environment).toLowerCase());
  const publicWritesEnabled = env.FAITHAI_PUBLIC_WRITES_ENABLED === undefined ? !production : /^(true|1|on|yes|enabled)$/i.test(String(env.FAITHAI_PUBLIC_WRITES_ENABLED));
  if (configured) {
    config.providers.ai = config.providers.ai && Boolean(aiProvider?.configured && configured.ai && (!databaseRequired || store?.reserveAiBudget));
    config.providers.stripe = config.providers.stripe && Boolean(configured.stripe && paymentAdapters.stripe && paymentWebhookVerifier);
    config.providers.paystack = config.providers.paystack && Boolean(paymentAdapters.paystack);
    config.providers.flutterwave = config.providers.flutterwave && Boolean(paymentAdapters.flutterwave);
    if (maxCallUsd) config.caps.estimatedAiCallUsd = maxCallUsd;
  }
  return {
    config,
    publicWritesEnabled,
    progress: {},
    powerCredits: [],
    events: [],
    outbox: [],
    idempotency: new Map(),
    rateBuckets: new Map(),
    emergencyResources,
    contentSources,
    paymentAdapters,
    paymentWebhookVerifier,
    paymentEventMapper,
    providerConfiguration: configured,
    store,
    databaseRequired,
    aiGateway: createAiGateway({ config, provider: aiProvider, ...(store?.reserveAiBudget ? { budget: { reserve: (input) => store.reserveAiBudget(input) } } : {}) }),
  };
}

function response(status, body) { return { status, body }; }

function rateKey(request) {
  const session = request.headers?.["x-faithai-session"] || "anonymous";
  const circle = request.headers?.["x-faithai-circle"] || "no-circle";
  return `${request.path}:${circle}:${session}`;
}

function withinRateLimit(state, request, now) {
  const key = rateKey(request);
  const bucket = state.rateBuckets.get(key) || [];
  const current = bucket.filter((time) => now - time < 60000);
  if (current.length >= 60) return false;
  current.push(now); state.rateBuckets.set(key, current); return true;
}

async function withIdempotency(state, request, create) {
  const key = request.headers?.["idempotency-key"];
  if (!key) return response(400, { error: "idempotency-key-required" });
  const compound = `${request.path}:${key}`;
  if (state.store?.runIdempotent) return state.store.runIdempotent(compound, request.path, create);
  if (state.store?.getIdempotency) {
    const existing = await state.store.getIdempotency(compound, request.path);
    if (existing) return existing;
  }
  if (state.idempotency.has(compound)) return state.idempotency.get(compound);
  const pending = (async () => {
    const result = await create(state.store);
    if (state.store?.putIdempotency) await state.store.putIdempotency(compound, request.path, result, new Date(Date.now() + 7 * 86400000));
    return result;
  })();
  state.idempotency.set(compound, pending);
  try { return await pending; } catch (error) { state.idempotency.delete(compound); throw error; }
}

export async function handleApiRequest(state, request, now = Date.now()) {
  if (request.path === "/health") request = { ...request, path: "/healthz" };
  if (request.path === "/v1/capabilities") request = { ...request, path: "/v1/integrations/status" };
  if (!ROUTES.has(request.path)) return response(404, { error: "not-found" });
  if (request.method === "GET" && request.path === "/healthz") {
    if (!state.store) return response(state.databaseRequired ? 503 : 200, { ok: !state.databaseRequired, database: state.databaseRequired ? "required-unavailable" : "memory", providers: "disabled-by-default" });
    try { return response(200, { ...(await state.store.health()), providers: "independent" }); }
    catch { return response(503, { ok: false, database: "unavailable", providers: "independent" }); }
  }
  if (!withinRateLimit(state, request, now)) return response(429, { error: "rate-limited", retryAfterSeconds: 60 });
  if (request.method === "POST" && PUBLIC_WRITE_ROUTES.has(request.path) && !state.publicWritesEnabled) return response(503, { accepted: false, code: "public-writes-disabled" });
  const query = request.query || {};
  const body = request.body || {};

  if (request.method === "GET" && request.path === "/v1/integrations/status") {
    const providerHealth = state.store?.providerStatus ? await state.store.providerStatus() : [];
    return response(200, { ...publicIntegrationStatus(state.config), providerHealth, readiness: Object.fromEntries(Object.entries(state.config.providers).map(([name, enabled]) => [name, { enabled, configured: state.providerConfiguration?.[name] ?? null, verifiedLive: false }])), aiBudget: state.store?.reserveAiBudget ? "durable-conservative-reservation" : "memory-only", publicWritesEnabled: state.publicWritesEnabled });
  }

  if (request.method === "GET" && request.path === "/v1/packs") {
    if (state.store?.listPacks) return response(200, { packs: await state.store.listPacks({ kind: query.kind || null, locale: query.locale || null, now: new Date(now) }), prototype: false });
    const packs = CONTENT_PACKS.filter((pack) => (!query.kind || pack.kind === query.kind) && (!query.locale || pack.locale === query.locale) && isPackFresh(pack, new Date(now)));
    return response(200, { packs, prototype: true });
  }
  if (request.method === "GET" && request.path === "/v1/resources") {
    if (state.store?.listResources) return response(200, { records: await state.store.listResources({ now: new Date(now) }), prototype: false });
    const records = CONTENT_PACKS.filter((pack) => ["agriculture", "aid", "safety"].includes(pack.kind) && isPackFresh(pack, new Date(now))).map((pack) => ({ id: pack.id, topic: pack.kind, territory: pack.territory, sourceOrganization: pack.sources[0].title, eligibilityText: "Information only; no automatic eligibility decision.", deliveryChannel: "web/pwa/print", verificationDate: pack.publicationDate, expiration: pack.expiration, stewardStatus: pack.status, sourceUrl: pack.sources[0].url }));
    return response(200, { records, prototype: true });
  }
  if (request.method === "POST" && request.path === "/v1/circles/join") {
    const circle = await joinPrototypeCircle(body.code);
    return circle ? response(200, { circle, nicknameStored: false }) : response(404, { error: "invitation-unavailable" });
  }
  if (request.method === "GET" && request.path === "/v1/challenges") {
    if (!query.circle) return response(400, { error: "circle-scope-required" });
    return response(200, { challenges: CHALLENGES.filter((item) => item.circleId === query.circle) });
  }
  if (request.method === "POST" && request.path === "/v1/progress") {
    return await withIdempotency(state, request, () => {
      try {
        state.progress = recordChallengeProgress(state.progress, body.challengeId, body.response);
        return response(202, { accepted: true, response: state.progress[body.challengeId].response });
      } catch { return response(400, { error: "invalid-progress" }); }
    });
  }
  if (request.method === "GET" && request.path === "/v1/signals") {
    return response(200, { signals: [], reason: "No live signal registry is connected in this prototype." });
  }
  if (request.method === "POST" && request.path === "/v1/ads/contextual") {
    const context = createAdContext({ surface: body.surface, locale: body.locale, territory: body.territory, ageClass: body.ageClass });
    return response(200, { context, ...getAdEligibility(context), placement: null });
  }
  if (request.method === "POST" && request.path === "/v1/sync/events") {
    return await withIdempotency(state, request, async (transactionStore) => {
      if (String(body.type || "").toLowerCase().includes("safety") || body.sensitive === true) return response(400, { error: "sensitive-event-not-synced" });
      const event = { id: `event-${state.events.length + 1}`, type: body.type, payload: body.payload, receivedAt: new Date(now).toISOString() };
      if (transactionStore?.saveSyncEvent) event.id = await transactionStore.saveSyncEvent(event, request.headers["idempotency-key"]);
      state.events.push(event); state.outbox.push({ ...event, attempts: 0, status: "ready", idempotencyKey: request.headers["idempotency-key"] });
      return response(202, { accepted: true, eventId: event.id });
    });
  }
  if (request.method === "POST" && request.path === "/v1/power-credits") {
    return await withIdempotency(state, request, async (transactionStore) => {
      if (body.cashAmount || (!body.donatedResource && !body.request)) return response(400, { error: "noncash-resource-or-request-required" });
      const record = { id: `pc-${state.powerCredits.length + 1}`, donatedResource: body.donatedResource || null, restrictions: body.restrictions || null, request: body.request || null, reviewer: null, allocation: null, receipt: state.store ? "vps-review-required" : "prototype-local-record" };
      if (transactionStore?.savePowerCredit) record.id = await transactionStore.savePowerCredit(record);
      state.powerCredits.push(record);
      return response(201, record);
    });
  }
  if (request.method === "POST" && request.path === "/v1/ai/interpret") {
    if (Object.prototype.hasOwnProperty.call(body, "utterance") && !body.approvedUtterance) return response(400, { error: "approved-utterance-required" });
    const result = await state.aiGateway.interpret({ approvedUtterance: body.approvedUtterance, locale: body.locale, territory: body.territory, scene: body.scene, consent: body.consent === true, sessionKey: request.headers?.["x-faithai-session"] || "anonymous", requestId: body.requestId || "api" });
    return response(result.ok ? 200 : result.code === "consent-required" || result.code === "utterance-required" ? 400 : 503, result);
  }
  if (request.method === "GET" && request.path === "/v1/emergency/resources") {
    if (!state.config.providers.emergency) return response(200, { resources: [], reason: "emergency-referrals-disabled" });
    if (state.store?.listEmergencyResources) return response(200, { resources: await state.store.listEmergencyResources({ territory: query.territory || "global", locale: query.locale || "en", now: new Date(now) }), referralOnly: true });
    return response(200, { resources: listEmergencyResources(state.emergencyResources, { territory: query.territory || "global", locale: query.locale || "en", now }), referralOnly: true });
  }
  if (request.method === "GET" && request.path === "/v1/content/sources") {
    if (state.store?.listContentSources) return response(200, { sources: await state.store.listContentSources() });
    return response(200, { sources: state.contentSources.map(({ id, name, territories, locales, licensePolicy }) => ({ id, name, territories, locales, licensePolicy })) });
  }
  if (request.method === "POST" && request.path === "/v1/payments/create-link") {
    const result = await withIdempotency(state, request, async () => {
      const adapter = state.paymentAdapters[body.provider];
      if (!adapter) return response(503, { created: false, code: "payment-adapter-disabled" });
      const link = await adapter.createPaymentLink({ ...body, idempotencyKey: request.headers["idempotency-key"] });
      return response(link.created ? 201 : 503, link);
    });
    return result;
  }
  if (request.method === "POST" && request.path === "/v1/payments/webhook") {
    if (!state.paymentWebhookVerifier) return response(503, { accepted: false, code: "payment-webhook-disabled" });
    const payload = request.rawBody || JSON.stringify(body);
    const signature = request.headers?.["stripe-signature"] || request.headers?.["x-faithai-payment-signature"];
    if (!(await state.paymentWebhookVerifier(payload, signature))) return response(401, { accepted: false, code: "invalid-payment-signature" });
    const payment = state.paymentEventMapper ? state.paymentEventMapper(body) : body;
    if (!payment) return response(200, { accepted: true, ignored: true });
    if (state.paymentEventMapper && !payment.eventId) return response(400, { accepted: false, code: "payment-event-id-required" });
    const eventRequest = state.paymentEventMapper ? { ...request, headers: { ...request.headers, "idempotency-key": payment.eventId } } : request;
    return await withIdempotency(state, eventRequest, async (transactionStore) => {
      const ledgerType = paymentLedgerType(payment.purpose);
      if (transactionStore?.recordRevenue) await transactionStore.recordRevenue({ ledgerType, amountMinor: Number(payment.amountMinor), currency: String(payment.currency || "USD"), source: String(payment.provider || "hosted-payment"), restrictions: payment.restrictions || null, externalId: payment.externalId || null });
      return response(202, { accepted: true, ledgerType, externalId: payment.externalId || null });
    });
  }
  return response(405, { error: "method-not-allowed" });
}
