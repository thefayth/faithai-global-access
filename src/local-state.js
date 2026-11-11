import { JOURNEY_LANES, normalizeJourneyHistory } from "./journey-engine.js";
import { normalizeWalkthroughState, toPersistedWalkthrough, WALKTHROUGH_STORAGE_KEY } from "./walkthrough-engine.js";

export const STORAGE_KEYS = {
  history: "faithai.path-history.v1",
  legacyStep: "faithai.saved-next-step.v1",
  signalConsent: "faithai.signal-consent.v1",
  signalMuted: "faithai.signal-muted.v1",
  savedSignals: "faithai.saved-signals.v1",
  legacySignal: "faithai.saved-signal.v1",
  language: "faithai.language.v1",
  asciiPhone: "faithai.ascii-phone.v1",
  helpState: "faithai.help-state.v1",
  ageClass: "faithai.age-class.v1",
  contextualAdConsent: "faithai.contextual-ad-consent.v1",
  walkthrough: WALKTHROUGH_STORAGE_KEY,
};

function readJson(storage, key, fallback) {
  try {
    const parsed = JSON.parse(storage.getItem(key));
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function isReceipt(value) {
  return value && Number.isInteger(value.option) && Number.isInteger(value.choice) && typeof value.step === "string";
}

export function loadHistory(storage) {
  const history = readJson(storage, STORAGE_KEYS.history, []);
  if (Array.isArray(history)) {
    const valid = history.filter(isReceipt).slice(0, 20);
    if (valid.length) return normalizeJourneyHistory(valid);
  }

  const legacy = readJson(storage, STORAGE_KEYS.legacyStep, null);
  if (!legacy || !Number.isInteger(legacy.option)) return [];

  return normalizeJourneyHistory([{
    id: `LEGACY-${legacy.option}`,
    type: "path",
    option: legacy.option,
    label: legacy.label || "SAVED PATH",
    choice: 1,
    choiceLabel: "EARLIER SAVED STEP",
    step: legacy.step || "Review the earlier saved path.",
    savedAt: legacy.savedAt || new Date(0).toISOString(),
    storage: "this device only",
  }]);
}

export function savePathReceipt(storage, receipt) {
  const history = loadHistory(storage);
  const next = normalizeJourneyHistory([
    { ...receipt, lane: receipt.completedAt ? "done" : "now" },
    ...history.filter((item) => item.id !== receipt.id),
  ]).slice(0, 20);
  storage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
  storage.setItem(STORAGE_KEYS.legacyStep, JSON.stringify(receipt));
  return next;
}

export function completePathReceipt(storage, receiptId, completedAt = new Date().toISOString()) {
  const history = loadHistory(storage);
  const next = normalizeJourneyHistory(history.map((receipt) => receipt.id === receiptId ? { ...receipt, completedAt, lane: "done" } : receipt));
  storage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
  const completed = next.find((receipt) => receipt.id === receiptId) ?? null;
  if (completed) storage.setItem(STORAGE_KEYS.legacyStep, JSON.stringify(completed));
  return { history: next, receipt: completed };
}

export function movePathReceipt(storage, receiptId, lane) {
  if (!JOURNEY_LANES.includes(lane)) throw new Error("Unknown journey lane.");
  const history = loadHistory(storage);
  const next = normalizeJourneyHistory(history.map((receipt) => {
    if (receipt.id !== receiptId) return receipt;
    if (lane === "done") return { ...receipt, lane, completedAt: receipt.completedAt || new Date().toISOString() };
    const { completedAt: _completedAt, ...openReceipt } = receipt;
    return { ...openReceipt, lane };
  }));
  storage.setItem(STORAGE_KEYS.history, JSON.stringify(next));
  const moved = next.find((receipt) => receipt.id === receiptId) ?? null;
  if (moved) storage.setItem(STORAGE_KEYS.legacyStep, JSON.stringify(moved));
  return { history: next, receipt: moved };
}

export function saveSignalReceipt(storage, signal) {
  const saved = readJson(storage, STORAGE_KEYS.savedSignals, []);
  const next = [{ id: signal.id, savedAt: new Date().toISOString() }, ...(Array.isArray(saved) ? saved : []).filter((item) => item.id !== signal.id)].slice(0, 20);
  storage.setItem(STORAGE_KEYS.savedSignals, JSON.stringify(next));
  return next;
}

export function loadWalkthroughState(storage, locale = "en") {
  return normalizeWalkthroughState(readJson(storage, STORAGE_KEYS.walkthrough, null), locale);
}

export function saveWalkthroughState(storage, state) {
  const persisted = toPersistedWalkthrough(state);
  storage.setItem(STORAGE_KEYS.walkthrough, JSON.stringify(persisted));
  return persisted;
}

export function clearFaithaiLocalData(storage) {
  Object.values(STORAGE_KEYS).forEach((key) => storage.removeItem(key));
}
