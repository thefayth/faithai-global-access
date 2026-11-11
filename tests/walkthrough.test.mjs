import assert from "node:assert/strict";
import test from "node:test";
import { GuideProvider, interpretLocally } from "../src/guide-provider.js";
import { createSpeechPort } from "../src/speech-port.js";
import { getWalkthroughCopy, WALKTHROUGH_LOCALES } from "../src/walkthrough-copy.js";
import { createWalkthroughChannelScreen } from "../src/walkthrough-channel.js";
import { experienceForHostname } from "../src/experience-lane.js";
import {
  artifactToText,
  createWalkthroughState,
  INTENT_IDS,
  normalizeWalkthroughState,
  toPersistedWalkthrough,
  WALKTHROUGH_SCENES,
  walkthroughReducer,
} from "../src/walkthrough-engine.js";

const NOW = "2026-08-07T07:00:00.000Z";
const step = (state, action) => walkthroughReducer(state, { ...action, now: NOW });

test("the two public hosts enter their intended lanes while previews retain the chooser", () => {
  assert.equal(experienceForHostname("app.binetusa.org"), "binet");
  assert.equal(experienceForHostname("AI.THEFAYTH.NET."), "general");
  assert.equal(experienceForHostname("faithai.aixyz.tech"), null);
});

test("the pure game loop reaches a useful project save point within five exchanges", () => {
  let state = createWalkthroughState("en", NOW);
  state = step(state, { type: "boot" });
  const result = interpretLocally("I'm trying to build a neighborhood tool", "en");
  assert.equal(result.intent, "project");
  state = step(state, { type: "interpret", result });
  assert.equal(state.scene, WALKTHROUGH_SCENES.CONFIRM);
  state = step(state, { type: "confirm", accepted: true });
  state = step(state, { type: "act", actionId: 1 });
  assert.equal(state.scene, WALKTHROUGH_SCENES.RECEIPT);
  assert.equal(state.artifactDraft.kind, "project");
  assert.match(state.artifactDraft.title, /SEVEN-DAY PROOF/);
  assert.ok(state.exchangeCount <= 5);
  assert.equal("score" in state.artifactDraft, false);
  assert.doesNotMatch(artifactToText(state.artifactDraft), /streak|leaderboard/i);
});

test("every authored route produces a route-specific artifact through numbers only", () => {
  for (const intent of INTENT_IDS) {
    let state = step(createWalkthroughState("en", NOW), { type: "boot" });
    state = step(state, { type: "choose", intent });
    state = step(state, { type: "act", actionId: 1 });
    assert.equal(state.scene, WALKTHROUGH_SCENES.RECEIPT, intent);
    assert.equal(state.artifactDraft.kind, intent);
    assert.equal(state.artifactDraft.fields.length, 3);
    assert.ok(state.exchangeCount <= 5, intent);
  }
});

test("ambiguous input asks once for a numbered route instead of inventing context", () => {
  const result = interpretLocally("everything is a lot", "en");
  assert.equal(result.intent, null);
  assert.equal(result.ambiguous, true);
  let state = step(createWalkthroughState("en", NOW), { type: "boot" });
  state = step(state, { type: "interpret", result });
  assert.equal(state.scene, WALKTHROUGH_SCENES.CHOOSE);
  state = step(state, { type: "choose", intent: "support" });
  assert.equal(state.scene, WALKTHROUGH_SCENES.ACT);
  assert.equal(state.confirmedIntent.provenance, "numbered-choice");
});

test("local routing accepts AAVE, spelling variation, and reviewed-language phrases", () => {
  const cases = [
    ["put me on to coding", "learning", "en"],
    ["i need somebody to watch my kids Tuesday", "care", "en"],
    ["trying to get this side hustle off the ground", "project", "en"],
    ["my data ran out and I need a laptop", "tools", "en"],
    ["i need skool help so i can lern", "learning", "en"],
    ["necesito comida y alquiler", "aid", "es"],
    ["j'ai besoin de logement", "aid", "fr"],
    ["nahitaji msaada wa kilimo na udongo", "agriculture", "sw"],
    ["أحتاج مساعدة في زراعة المحصول", "agriculture", "ar"],
  ];
  for (const [phrase, expected, locale] of cases) assert.equal(interpretLocally(phrase, locale).intent, expected, phrase);
});

test("anger and metaphor are not treated as danger, while explicit danger is", () => {
  assert.equal(interpretLocally("this homework is killing me", "en").intent, "learning");
  assert.equal(interpretLocally("I'm mad and need to build my app", "en").intent, "project");
  assert.equal(interpretLocally("someone is hurting me and I am not safe", "en").intent, "safety");
});

test("raw and unconfirmed text never enters persisted walkthrough state", () => {
  let state = step(createWalkthroughState("en", NOW), { type: "boot" });
  state = step(state, { type: "interpret", result: interpretLocally("my rent is late", "en") });
  const unconfirmed = JSON.stringify(toPersistedWalkthrough(state));
  assert.doesNotMatch(unconfirmed, /rent|pendingIntent|utterance|transcript/i);
  assert.equal(JSON.parse(unconfirmed).confirmedIntent, null);

  state = step(state, { type: "confirm", accepted: true });
  state = step(state, { type: "act", actionId: 1 });
  const unsaved = toPersistedWalkthrough(state);
  assert.equal(unsaved.artifactDraft, null);
  assert.equal(normalizeWalkthroughState(unsaved, "en", NOW).scene, WALKTHROUGH_SCENES.ACT);
  state = step(state, { type: "save" });
  assert.equal(toPersistedWalkthrough(state).artifactDraft.kind, "aid");
});

test("safety exploration remains session-only even after a save action", () => {
  let state = step(createWalkthroughState("en", NOW), { type: "boot" });
  state = step(state, { type: "choose", intent: "safety" });
  state = step(state, { type: "act", actionId: 1 });
  state = step(state, { type: "save" });
  assert.equal(state.saveStatus, "unsaved");
  const persisted = toPersistedWalkthrough(state);
  assert.equal(persisted.scene, WALKTHROUGH_SCENES.BOOT);
  assert.equal(persisted.confirmedIntent, null);
  assert.equal(persisted.artifactDraft, null);
  const exited = step(state, { type: "quick-exit" });
  assert.equal(exited.scene, WALKTHROUGH_SCENES.BOOT);
  assert.equal(exited.confirmedIntent, null);
});

test("BiNet content is session-only until a person explicitly saves its card", () => {
  let state = step(createWalkthroughState("en", NOW), { type: "boot" });
  state = step(state, { type: "choose", intent: "support", contentVariant: "binet" });
  assert.equal(state.confirmedIntent.contentVariant, "binet");
  assert.equal(JSON.parse(JSON.stringify(toPersistedWalkthrough(state))).confirmedIntent, null);

  state = step(state, { type: "act", actionId: 1 });
  assert.match(state.artifactDraft.title, /BI COMMUNITY AND CONNECTION/);
  assert.match(state.artifactDraft.fields[0].value, /show up as yourself/i);
  assert.equal(toPersistedWalkthrough(state).confirmedIntent, null);

  state = step(state, { type: "save" });
  assert.equal(toPersistedWalkthrough(state).confirmedIntent.contentVariant, "binet");
});

test("stable SMS and USSD projections preserve numbered scene parity", () => {
  let state = createWalkthroughState("en", NOW);
  const screens = [createWalkthroughChannelScreen(state)];
  state = step(state, { type: "boot" });
  screens.push(createWalkthroughChannelScreen(state));
  state = step(state, { type: "choose", intent: "power" });
  screens.push(createWalkthroughChannelScreen(state));
  state = step(state, { type: "act", actionId: 1 });
  screens.push(createWalkthroughChannelScreen(state));
  assert.deepEqual(screens.map((screen) => screen.sceneId), [
    "FAITHAI-WALKTHROUGH-V1-BOOT",
    "FAITHAI-WALKTHROUGH-V1-LISTEN",
    "FAITHAI-WALKTHROUGH-V1-ACT",
    "FAITHAI-WALKTHROUGH-V1-RECEIPT",
  ]);
  screens.forEach((screen) => {
    assert.match(screen.text, /0\./);
    assert.match(screen.text, /SIMULATION ONLY \/ NOTHING SENT/);
    assert.equal(screen.simulated, true);
  });
  assert.match(screens[2].text, /AI TOKEN REQUEST/);
});

test("remote guidance is disabled without explicit consent and never handles safety", async () => {
  const calls = [];
  const provider = new GuideProvider({ remote: { configured: true, interpret: async (payload) => { calls.push(payload); return { intent: "project", confidence: 0.9 }; } } });
  await provider.interpret({ utterance: "everything", locale: "en", scene: "listen", remoteConsent: false });
  assert.equal(calls.length, 0);
  const remote = await provider.interpret({ utterance: "everything", locale: "en", scene: "listen", remoteConsent: true });
  assert.equal(remote.provenance, "remote");
  assert.deepEqual(Object.keys(calls[0]).sort(), ["locale", "scene", "utterance"]);
  await provider.interpret({ utterance: "I am not safe", locale: "en", scene: "listen", remoteConsent: true });
  assert.equal(calls.length, 1);
});

test("speech is constructed only after start, returns editable text, and cancels", () => {
  let constructed = 0;
  let started = 0;
  let aborted = 0;
  let timeoutCallback;
  class Recognition {
    constructor() { constructed += 1; }
    start() { started += 1; this.onstart?.(); }
    abort() { aborted += 1; }
  }
  const scope = {
    SpeechRecognition: Recognition,
    setTimeout: (callback) => { timeoutCallback = callback; return 7; },
    clearTimeout: () => {},
  };
  const port = createSpeechPort(scope, 1000);
  assert.equal(port.supported, true);
  assert.equal(constructed, 0);
  assert.match(port.requestConsent().disclosure, /external speech service/i);
  assert.equal(constructed, 0);
  let transcript = "";
  port.start({ onFinal: (value) => { transcript = value; } });
  assert.equal(constructed, 1);
  assert.equal(started, 1);
  port.recognition.onresult({ resultIndex: 0, results: Object.assign([[{ transcript: "I need a book" }]], { 0: Object.assign([{ transcript: "I need a book" }], { isFinal: true }) }) });
  assert.equal(transcript, "I need a book");
  timeoutCallback();
  assert.equal(aborted, 1);
  assert.equal(port.listening, false);
  assert.equal(port.error, "timeout");
});

test("unsupported speech retains a complete non-microphone path", () => {
  let error;
  const port = createSpeechPort({ setTimeout, clearTimeout });
  assert.equal(port.supported, false);
  assert.equal(port.start({ onError: (value) => { error = value; } }), false);
  assert.equal(error, "unsupported");
});

test("all five authored locales preserve routes, actions, and Arabic RTL", () => {
  assert.deepEqual(WALKTHROUGH_LOCALES, ["en", "es", "fr", "sw", "ar"]);
  for (const locale of WALKTHROUGH_LOCALES) {
    const copy = getWalkthroughCopy(locale);
    assert.deepEqual(Object.keys(copy.intentLabels), INTENT_IDS);
    for (const intent of INTENT_IDS) assert.equal(copy.actions[intent].length, 2, `${locale}/${intent}`);
  }
  assert.equal(getWalkthroughCopy("ar").dir, "rtl");
  let arabic = step(createWalkthroughState("ar", NOW), { type: "boot" });
  arabic = step(arabic, { type: "choose", intent: "agriculture" });
  arabic = step(arabic, { type: "act", actionId: 1 });
  assert.match(artifactToText(arabic.artifactDraft), /المصادر|الزراعة/);
  assert.doesNotMatch(artifactToText(arabic.artifactDraft), /NO ACCOUNT|SOURCES/);
});
