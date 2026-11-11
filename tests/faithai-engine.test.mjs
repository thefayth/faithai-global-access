import assert from "node:assert/strict";
import test from "node:test";
import { getChoice, getOption } from "../src/faithai-data.js";
import { createPathReceipt, createSignalPacket, createStepPacket, rankSignals } from "../src/faithai-engine.js";
import { getLocalizedOptions, getPacketLabels, LANGUAGES, localizeSignal, toPhoneSafe, translationCoverage } from "../src/i18n.js";
import { getJourneyBoard, getJourneyState, getJourneySummary, JOURNEY_STAGES } from "../src/journey-engine.js";
import { clearFaithaiLocalData, completePathReceipt, loadHistory, movePathReceipt, savePathReceipt, STORAGE_KEYS } from "../src/local-state.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test("each numbered path has an alphanumeric focus and concrete next step", () => {
  for (let path = 0; path <= 5; path += 1) {
    const option = getOption(path);
    assert.ok(option);
    assert.ok(option.choices.length >= 3);
    option.choices.forEach((choice, index) => {
      assert.equal(choice.id, index + 1);
      assert.ok(choice.action.length > 20);
    });
  }
});

test("saved receipts remain local, versioned, bounded, and resumable", () => {
  const storage = new MemoryStorage();
  const option = getOption(3);
  const choice = getChoice(option, 1);
  const receipt = createPathReceipt(option, choice, new Date("2026-08-05T12:34:56.000Z"));
  const history = savePathReceipt(storage, receipt);

  assert.equal(history.length, 1);
  assert.equal(loadHistory(storage)[0].choiceLabel, "AI TOKENS");
  assert.equal(storage.getItem(STORAGE_KEYS.history).includes("this device only"), true);
  assert.match(receipt.id, /^F31-/);
});

test("the four-stage journey advances only after a user action", () => {
  assert.deepEqual(JOURNEY_STAGES, ["choose", "focus", "save", "do"]);
  assert.deepEqual(getJourneyState({ selectedId: null, focusId: null, receipt: null }), { active: 0, completed: 0 });
  assert.deepEqual(getJourneyState({ selectedId: 3, focusId: null, receipt: null }), { active: 1, completed: 1 });
  assert.deepEqual(getJourneyState({ selectedId: 3, focusId: 1, receipt: null }), { active: 2, completed: 2 });
  assert.deepEqual(getJourneyState({ selectedId: 3, focusId: 1, receipt: { id: "F31" } }), { active: 3, completed: 3 });
  assert.deepEqual(getJourneyState({ selectedId: 3, focusId: 1, receipt: { id: "F31", completedAt: "2026-08-05" } }), { active: 3, completed: 4 });
});

test("completion is self-reported, local, reversible data rather than a score", () => {
  const storage = new MemoryStorage();
  const option = getOption(3);
  const receipt = createPathReceipt(option, getChoice(option, 1), new Date("2026-08-05T12:34:56.000Z"), "sw");
  savePathReceipt(storage, receipt);

  const completed = completePathReceipt(storage, receipt.id, "2026-08-05T13:00:00.000Z");

  assert.equal(completed.receipt.completedAt, "2026-08-05T13:00:00.000Z");
  assert.equal(completed.receipt.locale, "sw");
  assert.deepEqual(getJourneySummary(completed.history), { saved: 1, done: 1, now: 0, next: 0, later: 0 });
  assert.equal("score" in completed.receipt, false);
  assert.equal("rank" in completed.receipt, false);
});

test("journey receipts move between resumable lanes and only one item stays NOW", () => {
  const storage = new MemoryStorage();
  const first = createPathReceipt(getOption(3), getChoice(getOption(3), 1), new Date("2026-08-05T12:34:00.000Z"));
  const second = createPathReceipt(getOption(4), getChoice(getOption(4), 1), new Date("2026-08-05T12:35:00.000Z"));
  savePathReceipt(storage, first);
  savePathReceipt(storage, second);
  let board = getJourneyBoard(loadHistory(storage));
  assert.equal(board.now.length, 1);
  assert.equal(board.now[0].id, second.id);
  assert.equal(board.next[0].id, first.id);

  movePathReceipt(storage, second.id, "later");
  movePathReceipt(storage, first.id, "now");
  board = getJourneyBoard(loadHistory(storage));
  assert.equal(board.now[0].id, first.id);
  assert.equal(board.later[0].id, second.id);
});

test("signals rank support first and explain the saved context", () => {
  const support = createPathReceipt(getOption(5), getChoice(getOption(5), 2), new Date("2026-08-05T12:35:00.000Z"));
  const project = createPathReceipt(getOption(4), getChoice(getOption(4), 1), new Date("2026-08-05T12:34:00.000Z"));
  const signals = rankSignals([support, project]);

  assert.equal(signals.length, 4);
  assert.equal(signals[0].id, "support-first");
  assert.match(signals[0].reason, /Saved path 5\.2/);
  assert.ok(signals.every((signal) => signal.action && signal.importance));
});

test("step and signal packets say what happened and what did not", () => {
  const receipt = createPathReceipt(getOption(2), getChoice(getOption(2), 3), new Date("2026-08-05T12:34:00.000Z"));
  const stepPacket = createStepPacket(receipt);
  const [signal] = rankSignals([receipt]);
  const signalPacket = createSignalPacket(signal, 0, 2);

  assert.match(stepPacket, /NOT SENT/);
  assert.match(stepPacket, /PATH 2\.3/);
  assert.match(signalPacket, /SYNTHETIC/);
  assert.match(signalPacket, /NOTHING SENT OR ACTIVATED/);
});

test("all offline language packs preserve the same numbered paths and actions", () => {
  assert.equal(LANGUAGES.length, 5);
  translationCoverage().forEach((coverage) => {
    assert.deepEqual(coverage.missingUi, [], `${coverage.code} is missing interface copy`);
    assert.deepEqual(coverage.missingPaths, [], `${coverage.code} is missing a path`);
    assert.deepEqual(coverage.invalidChoices, [], `${coverage.code} has a mismatched focus menu`);
  });

  LANGUAGES.forEach(({ code }) => {
    const options = getLocalizedOptions(code);
    assert.deepEqual(options.map((option) => option.id).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
    options.forEach((option) => option.choices.forEach((choice, index) => {
      assert.equal(choice.id, index + 1);
      assert.ok(choice.action.length > 20);
    }));
  });
});

test("phone-safe mode removes Latin diacritics but preserves Arabic text", () => {
  assert.equal(toPhoneSafe("Français — déjà", "fr", true), "Francais - deja");
  assert.equal(toPhoneSafe("¿Qué acción?", "es", true), "Que accion?");
  assert.equal(toPhoneSafe("مساعدة الآن", "ar", true), "مساعدة الآن");
});

test("localized signals and packets use the currently selected language", () => {
  const option = getOption(5);
  const receipt = createPathReceipt(option, getChoice(option, 2), new Date("2026-08-05T12:35:00.000Z"));
  const [signal] = rankSignals([receipt]);
  const spanishOptions = getLocalizedOptions("es");
  const localizedSignal = localizeSignal(signal, "es", spanishOptions);
  const packet = createSignalPacket(localizedSignal, 0, 1, getPacketLabels("es"));

  assert.match(localizedSignal.reason, /ruta 5\.2/i);
  assert.match(packet, /SEÑAL/);
  assert.match(packet, /ESTADO/);
});

test("clear removes FAITHAI prototype data without touching unrelated storage", () => {
  const storage = new MemoryStorage();
  storage.setItem("unrelated", "keep");
  Object.values(STORAGE_KEYS).forEach((key) => storage.setItem(key, "value"));

  clearFaithaiLocalData(storage);

  assert.equal(storage.getItem("unrelated"), "keep");
  Object.values(STORAGE_KEYS).forEach((key) => assert.equal(storage.getItem(key), null));
});
