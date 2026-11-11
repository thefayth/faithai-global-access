import assert from "node:assert/strict";
import test from "node:test";
import { createAiGateway, InMemoryAiBudget } from "../src/ai-gateway.js";
import { configuredAdProviders, ExoClickProvider, getAdEligibility, getAdLoadDecision, getExoClickZoneConfig, loadConfiguredAd } from "../src/ad-provider.js";
import { createContentPublication, validateProviderSource } from "../src/content-provider.js";
import { validateEmergencyResource, listEmergencyResources } from "../src/emergency-registry.js";
import { createIntegrationConfig, publicIntegrationStatus } from "../src/integration-config.js";
import { createHostedPaymentAdapter, validatePaymentIntent } from "../src/payment-provider.js";
import { createApiState, handleApiRequest } from "../server/api-core.js";

test("external integrations default off while emergency remains referral-only", () => {
  const config = createIntegrationConfig({});
  const status = publicIntegrationStatus(config);
  assert.equal(status.providers.ai, false);
  assert.equal(status.providers.exoclick, false);
  assert.equal(status.providers.sms, false);
  assert.equal(status.sms, "simulator-only");
  assert.equal(status.emergency, "referral-only");
  assert.deepEqual(config.caps, { aiDailyUsd: 1, aiMonthlyUsd: 25, maxRemoteCallsPerSession: 3, maxRemoteChars: 2000, estimatedAiCallUsd: 0.01 });
});

test("AI gateway requires consent, excludes safety, and enforces the session cap", async () => {
  let calls = 0;
  const gateway = createAiGateway({ config: createIntegrationConfig({ FAITHAI_AI_ENABLED: "true" }), budget: new InMemoryAiBudget(), provider: { configured: true, interpret: async () => { calls += 1; return { intent: "learning", confidence: 0.8, extracted: {}, followUp: "Choose a lesson" }; } } });
  assert.equal((await gateway.interpret({ approvedUtterance: "learn budgeting", consent: false })).code, "consent-required");
  assert.equal((await gateway.interpret({ approvedUtterance: "I am in danger", consent: true })).code, "safety-local-only");
  for (let index = 0; index < 3; index += 1) assert.equal((await gateway.interpret({ approvedUtterance: `lesson ${index}`, consent: true })).ok, true);
  assert.equal((await gateway.interpret({ approvedUtterance: "lesson 4", consent: true })).code, "ai-budget-exhausted");
  assert.equal(calls, 3);
});

test("emergency records require freshness and two reviewers for high-impact resources", () => {
  const base = { id: "help-1", service: "Local referral", kind: "domestic-violence", territory: "global", locale: "en", phoneOrShortCode: "123", verificationDate: "2026-08-01", expirationDate: "2026-09-01", sourceOrganization: "Reviewed org", status: "approved" };
  assert.equal(validateEmergencyResource({ ...base, reviewers: ["one"] }).valid, false);
  assert.equal(validateEmergencyResource({ ...base, reviewers: ["one", "two"] }).valid, true);
  assert.equal(listEmergencyResources([{ ...base, reviewers: ["one", "two"] }], { now: new Date("2026-08-07") }).length, 1);
  assert.equal(listEmergencyResources([{ ...base, reviewers: ["one", "two"], expirationDate: "2026-08-06" }], { now: new Date("2026-08-07") }).length, 0);
});

test("content publication records allowlisted source, license, reviewers, and checksum", async () => {
  const source = { id: "fa-org", name: "FA Org", baseUrl: "https://example.org/library", licensePolicy: "open", territories: ["global"], locales: ["en"] };
  assert.equal(validateProviderSource(source).valid, true);
  const result = await createContentPublication({ source, body: "hello", reviewers: ["one", "two"], pack: { id: "book-1", kind: "aid", status: "approved", sourceUrl: "https://example.org/library/book-1", license: "CC BY", attribution: "FA Org" } });
  assert.equal(result.published, true);
  assert.match(result.pack.checksum, /^[a-f0-9]{64}$/);
  assert.equal((await createContentPublication({ source, body: "x", reviewers: ["one"], pack: { kind: "aid", status: "approved", sourceUrl: source.baseUrl, license: "CC BY", attribution: "FA Org" } })).code, "review-required");
});

test("hosted payments reject card data and return a link only through an enabled adapter", async () => {
  assert.equal(validatePaymentIntent({ provider: "stripe", amountMinor: 100, currency: "USD", purpose: "donation", cardNumber: "4242" }).valid, false);
  const adapter = createHostedPaymentAdapter({ provider: "stripe", enabled: true, createSession: async () => ({ id: "checkout-1", url: "https://pay.example/checkout-1" }) });
  const link = await adapter.createPaymentLink({ amountMinor: 100, currency: "USD", purpose: "donation" });
  assert.deepEqual(link, { created: true, provider: "stripe", url: "https://pay.example/checkout-1", externalId: "checkout-1" });
});

test("local API exposes status and keeps payment, AI, and ad providers gated", async () => {
  const state = createApiState();
  const status = await handleApiRequest(state, { method: "GET", path: "/v1/integrations/status", headers: {}, query: {}, body: {} });
  assert.equal(status.status, 200);
  assert.equal(status.body.providers.ai, false);
  const ai = await handleApiRequest(state, { method: "POST", path: "/v1/ai/interpret", headers: {}, query: {}, body: { approvedUtterance: "learn", consent: true } });
  assert.equal(ai.body.code, "remote-ai-disabled");
  const payment = await handleApiRequest(state, { method: "POST", path: "/v1/payments/create-link", headers: { "idempotency-key": "p1" }, query: {}, body: { provider: "stripe", amountMinor: 100, currency: "USD", purpose: "donation" } });
  assert.equal(payment.body.code, "payment-adapter-disabled");
  assert.deepEqual(configuredAdProviders({}), []);
  assert.equal(getAdEligibility({ surface: "aid", ageClass: "adult-confirmed" }).eligible, false);
});

test("contextual ads require an eligible adult surface, separate consent, and the server kill switch", () => {
  const context = { surface: "books", locale: "en", territory: "global", ageClass: "adult-confirmed" };
  assert.equal(getAdLoadDecision({ context, consent: false, providerEnabled: true }).reason, "contextual-ad-consent-required");
  assert.equal(getAdLoadDecision({ context, consent: true, providerEnabled: false }).reason, "provider-disabled");
  assert.equal(getAdLoadDecision({ context: { ...context, surface: "safety" }, consent: true, providerEnabled: true }).reason, "excluded-help-surface");
  assert.deepEqual(getAdLoadDecision({ context, consent: true, providerEnabled: true }), { load: true, eligible: true, reason: "contextual-only" });
});

test("ExoClick accepts only a standard HTTPS script host and numeric publisher zone", () => {
  const valid = getExoClickZoneConfig({ VITE_EXOCLICK_SCRIPT_URL: "https://a.magsrv.com/ad-provider.js", VITE_EXOCLICK_ZONE_ID: "123456", VITE_EXOCLICK_ZONE_CLASS: "eas6a97888e" });
  assert.equal(valid.configured, true);
  assert.equal(valid.sfwOnly, true);
  assert.equal(getExoClickZoneConfig({ VITE_EXOCLICK_SCRIPT_URL: "https://ads.example/ad.js", VITE_EXOCLICK_ZONE_ID: "123456" }).configured, false);
  assert.equal(getExoClickZoneConfig({ VITE_EXOCLICK_SCRIPT_URL: "http://a.magsrv.com/ad-provider.js", VITE_EXOCLICK_ZONE_ID: "123456" }).configured, false);
  assert.equal(getExoClickZoneConfig({ VITE_EXOCLICK_SCRIPT_URL: "https://a.magsrv.com/ad-provider.js", VITE_EXOCLICK_ZONE_ID: "not-a-zone" }).configured, false);
});

function createAdDom({ failScript = false } = {}) {
  const scripts = [];
  const created = [];
  const makeElement = (tagName) => {
    const listeners = {};
    const element = {
      tagName: tagName.toUpperCase(),
      dataset: {},
      className: "",
      src: "",
      addEventListener(type, callback) { listeners[type] = callback; },
      getAttribute(name) { return name === "src" ? this.src : null; },
      emit(type) { listeners[type]?.(); },
    };
    created.push(element);
    return element;
  };
  const documentRef = {
    scripts,
    createElement: makeElement,
    head: {
      appendChild(script) {
        scripts.push(script);
        queueMicrotask(() => script.emit(failScript ? "error" : "load"));
      },
    },
  };
  const host = {
    dataset: {},
    children: [],
    replaceChildren(...children) { this.children = children; },
  };
  return { created, documentRef, host, windowRef: {} };
}

test("ExoClick mounts the SFW publisher zone only after every gate and loads its script once", async () => {
  const env = { VITE_AD_PROVIDERS: "exoclick", VITE_EXOCLICK_SCRIPT_URL: "https://a.magsrv.com/ad-provider.js", VITE_EXOCLICK_ZONE_ID: "123456", VITE_EXOCLICK_ZONE_CLASS: "eas6a97888e", VITE_AD_LOAD_TIMEOUT_MS: "50" };
  const dom = createAdDom();
  const context = { surface: "books", locale: "en", territory: "global", ageClass: "adult-confirmed" };
  const blocked = await loadConfiguredAd(context, dom.host, { env, documentRef: dom.documentRef, windowRef: dom.windowRef, consent: false, providerEnabled: true });
  assert.equal(blocked.loaded, false);
  assert.equal(dom.documentRef.scripts.length, 0);
  const first = await loadConfiguredAd(context, dom.host, { env, documentRef: dom.documentRef, windowRef: dom.windowRef, consent: true, providerEnabled: true });
  const second = await new ExoClickProvider(env).load({ context, consent: true, host: dom.host, documentRef: dom.documentRef, windowRef: dom.windowRef });
  assert.equal(first.loaded, true);
  assert.equal(second.loaded, true);
  assert.equal(dom.documentRef.scripts.length, 1);
  assert.equal(dom.host.children[0].dataset.zoneid, "123456");
  assert.equal(dom.host.children[0].dataset.blockAdTypes, "101");
  assert.equal(dom.host.children[0].dataset.ex_av, "2");
  assert.equal(dom.windowRef.AdProvider.length, 2);
});

test("a failed ExoClick script leaves no ad-shaped blocker", async () => {
  const env = { VITE_EXOCLICK_SCRIPT_URL: "https://a.magsrv.com/ad-provider.js", VITE_EXOCLICK_ZONE_ID: "123456", VITE_AD_LOAD_TIMEOUT_MS: "50" };
  const dom = createAdDom({ failScript: true });
  const result = await new ExoClickProvider(env).load({ context: { surface: "books" }, consent: true, host: dom.host, documentRef: dom.documentRef, windowRef: dom.windowRef });
  assert.equal(result.loaded, false);
  assert.equal(dom.host.children.length, 0);
});
