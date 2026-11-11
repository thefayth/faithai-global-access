import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { apiUrl } from "../src/api-url.js";
import { LEARNING_GAMES, answerLearningStep, learningReceipt } from "../src/learning-games.js";
import { loadHistory, savePathReceipt } from "../src/local-state.js";
import { getWalkthroughCopy, WALKTHROUGH_LOCALES } from "../src/walkthrough-copy.js";
import { canOfferRemoteGuide, createRemoteGuideClient } from "../src/remote-guide.js";

test("API mount prefixes produce exactly one version segment", () => {
  for (const [base, expected] of [["", "/v1"], ["/v1", "/v1"], ["/faithai-api", "/faithai-api/v1"], ["/faithai-api/v1/", "/faithai-api/v1"], ["/help-api", "/help-api/v1"]]) {
    assert.equal(apiUrl("/v1/integrations/status", base), `${expected}/integrations/status`);
    assert.equal(apiUrl("integrations/status", base), `${expected}/integrations/status`);
  }
});

test("every active locale has all four numbered home choices", () => {
  for (const locale of WALKTHROUGH_LOCALES) {
    const copy = getWalkthroughCopy(locale);
    for (const field of ["homeStart", "homeContinue", "homeHelp", "homePlay"]) assert.ok(copy[field]?.length > 2, `${locale}.${field}`);
  }
  assert.equal(getWalkthroughCopy("ar").dir, "rtl");
});

test("both offline activities offer retryable choices and an explicitly saved action", () => {
  assert.equal(LEARNING_GAMES.length, 2);
  const entries = new Map();
  const storage = { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  for (const game of LEARNING_GAMES) {
    game.steps.forEach((step, index) => {
      assert.equal(answerLearningStep(game, index, 0), null);
      assert.equal(answerLearningStep(game, index, 1.5), null);
      assert.equal(answerLearningStep(game, index, step.answer === 1 ? 2 : 1).accepted, false);
      assert.equal(answerLearningStep(game, index, step.answer).accepted, true);
    });
    const receipt = learningReceipt(game, new Date("2026-11-10T12:00:00Z"));
    assert.equal(entries.size, game === LEARNING_GAMES[0] ? 0 : 2);
    savePathReceipt(storage, receipt);
    const reopened = loadHistory(storage).find((item) => item.id === receipt.id);
    assert.equal(reopened.type, "learning");
    assert.equal(reopened.step, game.action);
    assert.equal(reopened.choiceLabel, game.title);
  }
});

async function serviceWorkerHarness() {
  const events = {};
  const writes = [];
  const removed = [];
  let response = new Response("public shell", { headers: { "content-type": "text/html" } });
  const context = {
    URL,
    self: { registration: { scope: "https://app.binetusa.org/help/" }, location: { origin: "https://app.binetusa.org" }, addEventListener: (name, handler) => { events[name] = handler; }, skipWaiting() {}, clients: { claim() {} } },
    caches: { open: async () => ({ put: async (key) => writes.push(key) }), match: async () => undefined, keys: async () => ["other-app-cache", "faithai-public-%2F-v6", "faithai-public-%2Fhelp%2F-v5", "faithai-public-%2Fhelp%2F-v6", "faithai-runtime-v5"], delete: async (key) => removed.push(key) },
    fetch: async () => response.clone(),
  };
  vm.runInNewContext(await readFile(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  return { events, writes, removed, setResponse: (value) => { response = value; } };
}

test("service worker leaves API, private, external and query requests untouched", async () => {
  const { events } = await serviceWorkerHarness();
  for (const path of ["/help-api/v1/integrations/status", "/v1/sync/events", "/help/safety", "/private/", "/help/?token=private"]) {
    let handled = false;
    events.fetch({ request: { method: "GET", mode: "navigate", url: `https://app.binetusa.org${path}` }, respondWith: () => { handled = true; } });
    assert.equal(handled, false, path);
  }
});

test("public shell/assets cache without caching private responses", async () => {
  const harness = await serviceWorkerHarness();
  const request = { method: "GET", mode: "cors", url: "https://app.binetusa.org/help/assets/main.js" };
  let result;
  harness.events.fetch({ request, respondWith: (promise) => { result = promise; } });
  assert.ok(await result);
  assert.equal(harness.writes.length, 1);
  harness.setResponse(new Response("private", { headers: { "cache-control": "private, no-store" } }));
  harness.events.fetch({ request, respondWith: (promise) => { result = promise; } });
  await result;
  assert.equal(harness.writes.length, 1);
});

test("service-worker upgrade removes unsafe legacy cache but preserves other applications", async () => {
  const harness = await serviceWorkerHarness();
  let activation;
  harness.events.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.deepEqual(harness.removed.sort(), ["faithai-public-%2Fhelp%2F-v5", "faithai-runtime-v5"].sort());
});

const ambiguousBooks = { intent: "books", confidence: 0.62, ambiguous: true, sensitive: false, provenance: "local", extracted: {} };
const safeRemote = { utterance: "read and learn", locale: "en", experience: "general", localResult: ambiguousBooks };
const readyCapabilities = { providers: { ai: true }, readiness: { ai: { enabled: true, configured: true } }, liveTerritories: ["us"] };

test("online guide excludes BiNet, other locales, sensitive requests, contact data and clear local matches", () => {
  assert.equal(canOfferRemoteGuide(safeRemote), true);
  assert.equal(canOfferRemoteGuide({ ...safeRemote, experience: "binet" }), false);
  assert.equal(canOfferRemoteGuide({ ...safeRemote, locale: "ar" }), false);
  assert.equal(canOfferRemoteGuide({ ...safeRemote, localResult: { ...ambiguousBooks, ambiguous: false } }), false);
  assert.equal(canOfferRemoteGuide({ ...safeRemote, localResult: { ...ambiguousBooks, intent: "aid" } }), false);
  for (const utterance of ["read food benefits", "learn medical care", "read immigration eligibility", "bisexual books", "read my address", "read me@private.example", "learn call 123 456 7890"]) assert.equal(canOfferRemoteGuide({ ...safeRemote, utterance }), false, utterance);
});

test("online guide needs configured capability and consent for each exact approved utterance", async () => {
  const calls = [];
  const client = createRemoteGuideClient({ base: "/faithai-api", sessionKey: "ephemeral-session", fetcher: async (url, options) => {
    calls.push({ url, options });
    return Response.json(url.endsWith("capabilities") ? readyCapabilities : { ok: true, intent: "learning", confidence: 0.9, extracted: { privateField: "discard" } });
  } });
  const request = { approvedUtterance: safeRemote.utterance, locale: "en", experience: "general", localResult: ambiguousBooks };
  assert.equal(await client.interpretApproved({ ...request, consent: true }), ambiguousBooks);
  assert.equal(calls.length, 0);
  assert.equal(await client.checkAvailability(), true);
  assert.equal(await client.interpretApproved(request), ambiguousBooks);
  assert.equal(calls.length, 1);
  const result = await client.interpretApproved({ ...request, consent: true });
  assert.equal(result.provenance, "remote");
  assert.deepEqual(result.extracted, {});
  assert.equal(calls[1].url, "/faithai-api/v1/ai/interpret");
  const body = JSON.parse(calls[1].options.body);
  assert.deepEqual(Object.keys(body).sort(), ["approvedUtterance", "locale", "territory", "scene", "consent", "requestId"].sort());
  assert.equal(body.approvedUtterance, safeRemote.utterance);
  assert.equal(body.territory, "us");
  assert.equal(calls[1].options.headers["x-faithai-session"], "ephemeral-session");
});

test("unconfigured or unavailable AI falls back locally and pending requests can be cancelled", async () => {
  let ready = false;
  const client = createRemoteGuideClient({ fetcher: async (url, options) => {
    if (url.endsWith("capabilities")) return Response.json(ready ? readyCapabilities : { providers: { ai: true }, readiness: { ai: { enabled: true, configured: false } }, liveTerritories: ["us"] });
    return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("cancelled"))));
  } });
  assert.equal(await client.checkAvailability(), false);
  ready = true;
  assert.equal(await client.checkAvailability(), true);
  const pending = client.interpretApproved({ approvedUtterance: safeRemote.utterance, consent: true, locale: "en", experience: "general", localResult: ambiguousBooks });
  client.cancel();
  assert.equal(await pending, ambiguousBooks);
});
