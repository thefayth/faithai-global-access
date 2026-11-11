import assert from "node:assert/strict";
import test from "node:test";
import { createAdContext, getAdEligibility } from "../src/ad-provider.js";
import { CHALLENGES, aggregateChallengeProgress, joinPrototypeCircle, normalizeCircleCode, recordChallengeProgress } from "../src/challenge-engine.js";
import { SimulatorChannelProvider, createLowTechScreen } from "../src/channel-provider.js";
import { MemoryChunkStore, downloadPackResumable, sha256Hex, verifyPackChecksum } from "../src/content-pack-runtime.js";
import { CONTENT_PACKS, HELP_MENU, LOCALE_REGISTRY, createPackText, isPackFresh, validateContentPack } from "../src/help-content.js";
import { createRecoveryBundle, openRecoveryBundle } from "../src/recovery.js";
import { recordLedgerEntry } from "../src/revenue-ledger.js";

test("the numbered Help Hub preserves every planned lane and reviewed language state", () => {
  assert.deepEqual(HELP_MENU.map((item) => item.id), [1, 2, 3, 4, 5, 6, 7]);
  assert.deepEqual(HELP_MENU.map((item) => item.key), ["challenges", "books", "agriculture", "aid", "safety", "power-credits", "partners"]);
  assert.equal(LOCALE_REGISTRY.filter((item) => item.status === "available").length, 5);
  assert.deepEqual(LOCALE_REGISTRY.filter((item) => item.status === "review-queue").map((item) => item.locale), ["pt", "hi", "bn", "ur", "id", "ha"]);
});

test("every built-in pack carries provenance, licensing, territory, review, and freshness receipts", () => {
  CONTENT_PACKS.forEach((pack) => {
    assert.deepEqual(validateContentPack(pack), { valid: true, missing: [] });
    assert.equal(isPackFresh(pack, new Date("2026-08-06T00:00:00Z")), true);
    const text = createPackText(pack);
    assert.match(text, /LICENSE:/);
    assert.match(text, /SOURCES/);
    assert.match(text, /HUMAN REGIONAL REVIEW REQUIRED/i);
  });
  assert.equal(isPackFresh(CONTENT_PACKS[0], new Date("2028-01-01T00:00:00Z")), false);
});

test("circle challenges are invitation-scoped, bounded, cooperative, and unranked", async () => {
  assert.equal(normalizeCircleCode("purple-7"), "PURPLE7");
  assert.ok(await joinPrototypeCircle("PURPLE7"));
  assert.equal(await joinPrototypeCircle("WRONG7"), null);
  const progress = recordChallengeProgress({}, CHALLENGES[0].id, "need_help", "2026-08-06T00:00:00Z");
  const total = aggregateChallengeProgress([progress], CHALLENGES[0].id);
  assert.deepEqual(total, { done: 0, need_help: 1, later: 0 });
  assert.equal("score" in total, false);
  assert.equal("rank" in total, false);
  assert.throws(() => recordChallengeProgress({}, CHALLENGES[0].id, "win"));
});

test("ad eligibility never receives private context and excludes hardship, safety, circles, and youth", () => {
  const context = createAdContext({ surface: "books", locale: "en", territory: "global", ageClass: "adult-confirmed", journeyHistory: ["private"], race: "private" });
  assert.deepEqual(Object.keys(context), ["surface", "locale", "territory", "ageClass"]);
  assert.deepEqual(getAdEligibility(context), { eligible: true, reason: "contextual-only" });
  ["safety", "aid", "housing", "health", "signals", "journey", "circle", "power-credits", "youth"].forEach((surface) => assert.equal(getAdEligibility({ ...context, surface }).eligible, false));
  assert.equal(getAdEligibility({ ...context, ageClass: "unknown" }).eligible, false);
});

test("SMS and USSD adapters are explicit simulators and retain numbered parity", async () => {
  const screen = createLowTechScreen("MORE HELP", HELP_MENU.map((item) => item.label));
  assert.match(screen.text, /1\. COMMUNITY CHALLENGES/);
  assert.match(screen.text, /0\. BACK/);
  const result = await new SimulatorChannelProvider("SMS").send({ screen: screen.text });
  assert.equal(result.delivered, false);
  assert.equal(result.simulated, true);
  assert.match(result.receipt, /NOT SENT/);
});

test("client recovery encrypts state with an unambiguous account-free code", async () => {
  const original = { "faithai.path-history.v1": "[{\"id\":\"private\"}]" };
  const created = await createRecoveryBundle(original, "ABCDE23456FGHJK789MN");
  assert.doesNotMatch(created.bundle, /private/);
  assert.deepEqual(await openRecoveryBundle(created.bundle, created.code), original);
  await assert.rejects(() => openRecoveryBundle(created.bundle, "ZZZZZ23456FGHJK789MN"));
});

test("content downloads resume with byte ranges and verify checksums before install", async () => {
  const bytes = new TextEncoder().encode("offline-pack-body");
  const store = new MemoryChunkStore();
  await store.append(bytes.slice(0, 7));
  let range;
  const downloaded = await downloadPackResumable("/pack.txt", { store, fetcher: async (_url, options) => { range = options.headers.Range; return new Response(bytes.slice(7), { status: 206 }); } });
  assert.equal(range, "bytes=7-");
  assert.equal(new TextDecoder().decode(downloaded), "offline-pack-body");
  const checksum = await sha256Hex(bytes);
  assert.equal(await verifyPackChecksum(downloaded, checksum), true);
  assert.equal(await verifyPackChecksum(downloaded, "development-manifest-not-signed"), false);
});

test("earned revenue, restricted funding, and noncash Power Credits stay separate", () => {
  let ledgers = { earned: [], restricted: [], "power-credit": [] };
  ledgers = recordLedgerEntry(ledgers, "earned", { source: "partner setup", amountMinor: 10000 });
  ledgers = recordLedgerEntry(ledgers, "restricted", { source: "translation grant", amountMinor: 50000, restrictions: "Hausa review" });
  ledgers = recordLedgerEntry(ledgers, "power-credit", { source: "AI tokens", quantity: 2000 });
  assert.deepEqual(Object.values(ledgers).map((items) => items.length), [1, 1, 1]);
  assert.throws(() => recordLedgerEntry(ledgers, "power-credit", { source: "cash", cashAmount: 1 }));
});
