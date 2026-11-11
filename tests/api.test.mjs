import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_CIRCLE } from "../src/challenge-engine.js";
import { createApiState, handleApiRequest } from "../server/api-core.js";
import { processOutbox } from "../server/outbox.js";

const request = (method, path, body = {}, extra = {}) => ({ method, path, body, query: extra.query || {}, headers: { "x-faithai-session": "test-session", ...(extra.headers || {}) } });

test("the API exposes packs and resources without an account", async () => {
  const state = createApiState();
  const packs = await handleApiRequest(state, request("GET", "/v1/packs"), new Date("2026-08-06T00:00:00Z").getTime());
  const resources = await handleApiRequest(state, request("GET", "/v1/resources"), new Date("2026-08-06T00:00:00Z").getTime());
  assert.equal(packs.status, 200);
  assert.ok(packs.body.packs.length >= 6);
  assert.equal(resources.status, 200);
  assert.ok(resources.body.records.every((record) => record.sourceUrl && record.expiration));
});

test("circle join resists listing and only returns the hashed invitation scope", async () => {
  const state = createApiState();
  const joined = await handleApiRequest(state, request("POST", "/v1/circles/join", { code: DEMO_CIRCLE.code }));
  const denied = await handleApiRequest(state, request("POST", "/v1/circles/join", { code: "BADCODE" }));
  assert.equal(joined.status, 200);
  assert.equal(joined.body.circle.code, undefined);
  assert.match(joined.body.circle.codeHash, /^[a-f0-9]{64}$/);
  assert.equal(denied.status, 404);
});

test("progress and sync events require idempotency and do not duplicate", async () => {
  const state = createApiState();
  const withoutKey = await handleApiRequest(state, request("POST", "/v1/progress", { challengeId: "c1", response: "done" }));
  assert.equal(withoutKey.status, 400);
  const keyed = request("POST", "/v1/sync/events", { type: "receipt.saved", payload: { receiptId: "local-1" } }, { headers: { "idempotency-key": "same-event" } });
  const first = await handleApiRequest(state, keyed);
  const second = await handleApiRequest(state, keyed);
  assert.deepEqual(second, first);
  assert.equal(state.events.length, 1);
  assert.equal(state.outbox.length, 1);
});

test("the contextual ads endpoint returns only approved context and no placement by default", async () => {
  const state = createApiState();
  const result = await handleApiRequest(state, request("POST", "/v1/ads/contextual", { surface: "books", locale: "en", territory: "global", ageClass: "adult-confirmed", safetyHistory: "must-drop" }));
  assert.equal(result.status, 200);
  assert.deepEqual(Object.keys(result.body.context), ["surface", "locale", "territory", "ageClass"]);
  assert.equal(result.body.placement, null);
});

test("Power Credits reject cash and issue idempotent noncash receipts", async () => {
  const state = createApiState();
  const cash = await handleApiRequest(state, request("POST", "/v1/power-credits", { cashAmount: 10 }, { headers: { "idempotency-key": "cash" } }));
  assert.equal(cash.status, 400);
  const noncashRequest = request("POST", "/v1/power-credits", { request: "200 AI tokens for a library workshop" }, { headers: { "idempotency-key": "tokens" } });
  const first = await handleApiRequest(state, noncashRequest);
  const second = await handleApiRequest(state, noncashRequest);
  assert.equal(first.status, 201);
  assert.deepEqual(second, first);
  assert.equal(state.powerCredits.length, 1);
});

test("outbox delivery retries at least once and moves poison events to dead-letter review", async () => {
  const state = createApiState();
  state.outbox.push({ id: "event-1", idempotencyKey: "once", status: "ready", attempts: 0 });
  await processOutbox(state, async () => { throw new Error("transport-down"); }, { maxAttempts: 2 });
  assert.equal(state.outbox[0].status, "retry");
  await processOutbox(state, async () => { throw new Error("transport-down"); }, { maxAttempts: 2 });
  assert.equal(state.outbox[0].status, "dead-letter");
  assert.equal(state.outbox[0].attempts, 2);
});

test("VPS health reflects required PostgreSQL availability", async () => {
  const unavailable = await handleApiRequest(createApiState({ databaseRequired: true }), request("GET", "/healthz"));
  assert.equal(unavailable.status, 503);
  const available = await handleApiRequest(createApiState({ databaseRequired: true, store: { health: async () => ({ ok: true, database: "postgresql" }) } }), request("GET", "/healthz"));
  assert.deepEqual(available, { status: 200, body: { ok: true, database: "postgresql", providers: "independent" } });
});

test("durable idempotency survives a fresh API process", async () => {
  const records = new Map();
  let eventWrites = 0;
  const store = {
    getIdempotency: async (key) => records.get(key) || null,
    putIdempotency: async (key, endpoint, value) => records.set(key, value),
    saveSyncEvent: async () => { eventWrites += 1; return `db-event-${eventWrites}`; },
  };
  const keyed = request("POST", "/v1/sync/events", { type: "receipt.saved", payload: { receiptId: "durable-1" } }, { headers: { "idempotency-key": "durable-event" } });
  const first = await handleApiRequest(createApiState({ store }), keyed);
  const second = await handleApiRequest(createApiState({ store }), keyed);
  assert.deepEqual(second, first);
  assert.equal(eventWrites, 1);
});

test("safety and explicitly sensitive events never enter durable sync", async () => {
  let writes = 0;
  const store = { getIdempotency: async () => null, putIdempotency: async () => {}, saveSyncEvent: async () => { writes += 1; } };
  const safety = await handleApiRequest(createApiState({ store }), request("POST", "/v1/sync/events", { type: "safety.plan.opened" }, { headers: { "idempotency-key": "private-1" } }));
  const sensitive = await handleApiRequest(createApiState({ store }), request("POST", "/v1/sync/events", { type: "receipt.saved", sensitive: true }, { headers: { "idempotency-key": "private-2" } }));
  assert.equal(safety.status, 400);
  assert.equal(sensitive.status, 400);
  assert.equal(writes, 0);
});

test("verified payment webhooks are durably idempotent across API restarts", async () => {
  const records = new Map();
  const ledger = [];
  const store = {
    getIdempotency: async (key) => records.get(key) || null,
    putIdempotency: async (key, endpoint, value) => records.set(key, value),
    recordRevenue: async (entry) => ledger.push(entry),
  };
  const options = { store, paymentWebhookVerifier: async (payload, signature) => payload.length > 0 && signature === "verified" };
  const webhook = request("POST", "/v1/payments/webhook", { purpose: "donation", provider: "stripe", amountMinor: 500, currency: "USD", externalId: "hosted-1" }, { headers: { "idempotency-key": "payment-1", "x-faithai-payment-signature": "verified" } });
  webhook.rawBody = JSON.stringify(webhook.body);
  const first = await handleApiRequest(createApiState(options), webhook);
  const replay = await handleApiRequest(createApiState(options), webhook);
  assert.deepEqual(replay, first);
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].ledgerType, "restricted");
});
