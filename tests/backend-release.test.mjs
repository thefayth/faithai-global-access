import assert from "node:assert/strict";
import test from "node:test";
import { createHmac } from "node:crypto";
import { createProviderRuntime, stripeRevenueEvent, verifyStripeSignature } from "../server/provider-runtime.js";
import { createOpenAiCompatibleProvider, createAiGateway } from "../src/ai-gateway.js";
import { createApiState, handleApiRequest } from "../server/api-core.js";
import { createIntegrationConfig } from "../src/integration-config.js";

const req = (method, path, body = {}, headers = {}) => ({ method, path, body, headers, query: {} });

test("startup flags do not claim configured AI or Stripe without provider credentials", async () => {
  const env = { FAITHAI_AI_ENABLED: "true", FAITHAI_STRIPE_ENABLED: "true" };
  const state = createApiState({ env, ...createProviderRuntime(env) });
  const status = await handleApiRequest(state, req("GET", "/v1/integrations/status"));
  assert.equal(status.body.providers.ai, false);
  assert.equal(status.body.providers.stripe, false);
  assert.equal(status.body.readiness.ai.configured, false);
  assert.equal(status.body.readiness.ai.verifiedLive, false);
});

test("health alias returns JSON health instead of a successful application shell", async () => {
  const state = createApiState({ databaseRequired: true });
  assert.deepEqual(await handleApiRequest(state, req("GET", "/health")), await handleApiRequest(state, req("GET", "/healthz")));
});

test("production public writes are disabled before persistence and require explicit activation", async () => {
  let writes = 0;
  const store = { saveSyncEvent: async () => { writes += 1; return "event-1"; }, savePowerCredit: async () => { writes += 1; return "pc-1"; } };
  const state = createApiState({ env: { NODE_ENV: "production" }, store });
  for (const path of ["/v1/sync/events", "/v1/power-credits", "/v1/circles/join", "/v1/progress"]) {
    const result = await handleApiRequest(state, req("POST", path, { type: "note", request: "private request", payload: { private: true } }, { "idempotency-key": path }));
    assert.equal(result.status, 503);
    assert.equal(result.body.code, "public-writes-disabled");
  }
  assert.equal(writes, 0);
  assert.equal(state.idempotency.size, 0);
  assert.equal((await handleApiRequest(state, req("GET", "/v1/capabilities"))).body.publicWritesEnabled, false);
  const enabled = createApiState({ env: { FAITHAI_ENVIRONMENT: "production", FAITHAI_PUBLIC_WRITES_ENABLED: "true" }, store });
  assert.equal((await handleApiRequest(enabled, req("POST", "/v1/power-credits", { request: "noncash access" }, { "idempotency-key": "approved-pilot" }))).status, 201);
  assert.equal(writes, 1);
  assert.equal(createApiState().publicWritesEnabled, true);
});

test("chat-completion JSON is validated and personal extracted fields are discarded", async () => {
  const provider = createOpenAiCompatibleProvider({ endpoint: "https://model.example/v1/chat/completions", apiKey: "test-only", model: "test", fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ intent: "learning", confidence: 0.8, followUp: "Choose a lesson", extracted: { privateDetail: "discard" } }) } }] }) }) });
  const result = await provider.interpret({ approvedUtterance: "learn", locale: "en", territory: "global", scene: "listen" });
  assert.equal(result.intent, "learning");
  assert.deepEqual(result.extracted, {});
  const invalid = createOpenAiCompatibleProvider({ endpoint: "https://model.example", apiKey: "test-only", model: "test", fetcher: async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '{"intent":"diagnosis"}' } }] }) }) });
  await assert.rejects(invalid.interpret({ approvedUtterance: "learn" }), /invalid-ai-response/);
});

test("Luna requests use bounded current parameters without changing generic providers", async () => {
  const requests = [];
  const fetcher = async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ choices: [{ message: { content: '{"intent":"learning","confidence":0.8}' } }] }) }; };
  for (const model of ["gpt-5.6-luna", "generic-local"]) {
    const provider = createOpenAiCompatibleProvider({ endpoint: "https://model.example/v1/chat/completions", apiKey: "test-only", model, maxOutputTokens: 9999, fetcher });
    await provider.interpret({ approvedUtterance: "\uffff".repeat(2000), locale: "en", territory: "us", scene: "listen" });
    await assert.rejects(provider.interpret({ approvedUtterance: "x".repeat(2001) }), /utterance-too-long/);
  }
  const [luna, generic] = requests;
  assert.equal(luna.max_completion_tokens, 512);
  assert.equal(luna.reasoning_effort, "none");
  assert.equal(luna.store, false);
  assert.equal(luna.service_tier, "default");
  assert.equal(Object.hasOwn(luna, "max_tokens"), false);
  assert.equal(Object.hasOwn(luna, "temperature"), false);
  assert.equal(generic.max_tokens, 512);
  assert.equal(generic.temperature, 0);
  // UTF-8 byte-per-token upper estimate plus 1,024 framing tokens. Standard
  // Luna prices reviewed 2026-11-10: $0.20/M input, $1.20/M output.
  const inputBound = luna.messages.reduce((total, message) => total + Buffer.byteLength(message.content, "utf8"), 1024);
  assert.ok((inputBound * 0.20 + 512 * 1.20) / 1_000_000 < 0.005);
});

test("capabilities alias and territory restrictions preserve the US-only AI pilot", async () => {
  let calls = 0;
  const state = createApiState({ env: { FAITHAI_AI_ENABLED: "true", FAITHAI_LIVE_TERRITORIES: "us" }, aiProvider: { configured: true, interpret: async () => { calls += 1; return { intent: "learning" }; } } });
  assert.deepEqual(await handleApiRequest(state, req("GET", "/v1/capabilities")), await handleApiRequest(state, req("GET", "/v1/integrations/status")));
  const body = { approvedUtterance: "general learning", consent: true };
  assert.equal((await handleApiRequest(state, req("POST", "/v1/ai/interpret", { ...body, territory: "global" }))).body.code, "ai-territory-disabled");
  assert.equal((await handleApiRequest(state, req("POST", "/v1/ai/interpret", { ...body, territory: "us", locale: "fr" }))).body.code, "ai-locale-disabled");
  assert.equal((await handleApiRequest(state, req("POST", "/v1/ai/interpret", { ...body, territory: "us" }))).status, 200);
  assert.equal(calls, 1);
});

test("medical/legal/eligibility scenes and sensitive input never reach a provider", async () => {
  let calls = 0;
  const gateway = createAiGateway({ config: createIntegrationConfig({ FAITHAI_AI_ENABLED: "true" }), provider: { configured: true, interpret: async () => { calls += 1; return {}; } } });
  for (const [scene, approvedUtterance] of [["medical", "help"], ["legal", "help"], ["aid", "help"], ["care", "help"], ["support", "help"], ["listen", "medication dosage"], ["listen", "am I eligible for benefits"], ["listen", "I am bisexual"], ["listen", "my rent is overdue"], ["listen", "reach me at private@example.test"]]) {
    assert.equal((await gateway.interpret({ scene, approvedUtterance, consent: true })).code, "sensitive-local-only");
  }
  assert.equal(calls, 0);
});

test("the AI gateway awaits a durable budget denial before any provider call", async () => {
  let calls = 0;
  const gateway = createAiGateway({ config: createIntegrationConfig({ FAITHAI_AI_ENABLED: "true" }), budget: { reserve: async () => false }, provider: { configured: true, interpret: async () => { calls += 1; return {}; } } });
  assert.equal((await gateway.interpret({ approvedUtterance: "learn", consent: true })).code, "ai-budget-exhausted");
  assert.equal(calls, 0);
});

test("Stripe signatures cover exact raw bytes and reject tampering and expired delivery", () => {
  const now = 1794268800000;
  const timestamp = String(now / 1000);
  const payload = '{"type":"checkout.session.completed"}';
  const signature = createHmac("sha256", "test-secret").update(`${timestamp}.${payload}`).digest("hex");
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(verifyStripeSignature(payload, header, "test-secret", now), true);
  assert.equal(verifyStripeSignature(`${payload} `, header, "test-secret", now), false);
  assert.equal(verifyStripeSignature(payload, header, "test-secret", now + 301000), false);
});

test("Stripe Checkout uses the fixed return URL and forwards idempotency without card data", async () => {
  let sent;
  const runtime = createProviderRuntime({ FAITHAI_STRIPE_ENABLED: "true", FAITHAI_STRIPE_API_KEY: "test-only", FAITHAI_STRIPE_WEBHOOK_SECRET: "test-secret", FAITHAI_PAYMENT_RETURN_URL: "https://ai.example/contribute" }, { fetcher: async (url, options) => { sent = { url, ...options }; return { ok: true, json: async () => ({ id: "cs_test_example", url: "https://checkout.stripe.com/c/pay/test" }) }; } });
  const result = await runtime.paymentAdapters.stripe.createPaymentLink({ amountMinor: 500, currency: "USD", purpose: "donation", idempotencyKey: "request-1", returnUrl: "https://attacker.example" });
  assert.equal(result.created, true);
  assert.equal(sent.headers["idempotency-key"], "request-1");
  assert.equal(new URLSearchParams(sent.body).get("success_url"), "https://ai.example/contribute");
  assert.equal(sent.body.includes("attacker"), false);
  assert.equal((await runtime.paymentAdapters.stripe.createPaymentLink({ amountMinor: 500, currency: "USD", purpose: "donation", cardNumber: "4242", idempotencyKey: "request-2" })).created, false);
});

test("only paid Stripe events enter the ledger and replay deduplicates by event ID", async () => {
  const event = { id: "evt_test_1", type: "checkout.session.completed", data: { object: { id: "cs_test_1", payment_status: "paid", amount_total: 500, currency: "usd", metadata: { faithai_purpose: "donation" } } } };
  assert.equal(stripeRevenueEvent({ ...event, data: { object: { ...event.data.object, payment_status: "unpaid" } } }), null);
  const state = createApiState({ paymentWebhookVerifier: async () => true, paymentEventMapper: stripeRevenueEvent });
  const webhook = { ...req("POST", "/v1/payments/webhook", event, { "stripe-signature": "verified" }), rawBody: JSON.stringify(event) };
  const first = await handleApiRequest(state, webhook);
  assert.equal(first.status, 202);
  assert.deepEqual(await handleApiRequest(state, webhook), first);
  assert.equal(state.idempotency.size, 1);
});

test("simultaneous retries share one in-process result", async () => {
  let writes = 0;
  const state = createApiState({ store: { savePowerCredit: async () => { writes += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return "one-record"; } } });
  const request = req("POST", "/v1/power-credits", { request: "learning tools" }, { "idempotency-key": "simultaneous" });
  const [first, second] = await Promise.all([handleApiRequest(state, request), handleApiRequest(state, request)]);
  assert.deepEqual(first, second);
  assert.equal(writes, 1);
});
