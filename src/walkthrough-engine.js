import { getWalkthroughCopy } from "./walkthrough-copy.js";

export const WALKTHROUGH_VERSION = 1;
export const WALKTHROUGH_STORAGE_KEY = "faithai.walkthrough-state.v1";

export const WALKTHROUGH_SCENES = Object.freeze({
  BOOT: "boot",
  INSTRUCTIONS: "instructions",
  LISTEN: "listen",
  CONFIRM: "confirm",
  CHOOSE: "choose",
  ACT: "act",
  RECEIPT: "receipt",
});

export const INTENT_IDS = Object.freeze([
  "care", "learning", "tools", "project", "support", "books", "agriculture", "aid", "safety", "challenges", "power",
]);

export const INTENT_PATHS = Object.freeze({
  care: { option: 1, choice: 2 },
  learning: { option: 2, choice: 2 },
  tools: { option: 3, choice: 3 },
  project: { option: 4, choice: 1 },
  support: { option: 5, choice: 4 },
  books: { option: 2, choice: 3 },
  agriculture: { option: 5, choice: 2 },
  aid: { option: 5, choice: 2 },
  safety: { option: 5, choice: 1 },
  challenges: { option: 4, choice: 2 },
  power: { option: 3, choice: 1 },
});

function isoNow(action) {
  return action.now || new Date().toISOString();
}

/** @returns {import("./walkthrough-engine.js").WalkthroughState} */
export function createWalkthroughState(locale = "en", now = new Date().toISOString()) {
  return {
    version: WALKTHROUGH_VERSION,
    scene: WALKTHROUGH_SCENES.BOOT,
    locale,
    confirmedIntent: null,
    pendingIntent: null,
    artifactDraft: null,
    checkpoint: WALKTHROUGH_SCENES.BOOT,
    menuPage: 1,
    exchangeCount: 0,
    saveStatus: "unsaved",
    createdAt: now,
    updatedAt: now,
  };
}

export function createWalkthroughArtifact(intentId, actionId = 1, locale = "en", now = new Date().toISOString(), contentVariant = "general") {
  if (!INTENT_IDS.includes(intentId)) throw new Error("Unknown walkthrough intent.");
  const copy = getWalkthroughCopy(locale);
  const variant = contentVariant === "binet" ? getWalkthroughCopy("en").binet : null;
  const action = variant?.actions[intentId]?.[Number(actionId) - 1] || variant?.actions[intentId]?.[0] || copy.actions[intentId]?.[Number(actionId) - 1] || copy.actions[intentId]?.[0];
  if (!action) throw new Error("Unknown walkthrough action.");
  const createdCode = now.replace(/\D/g, "").slice(4, 18);
  const privateSafety = intentId === "safety";

  return {
    id: `W${INTENT_IDS.indexOf(intentId) + 1}${actionId}-${createdCode}`,
    kind: intentId,
    locale,
    title: `${variant?.intentLabels[intentId] || copy.intentLabels[intentId]} / ${action[0]}`,
    fields: [
      { label: copy.fieldAction, value: action[1] },
      { label: copy.fieldPrivacy, value: copy.privacyDefault },
      { label: copy.fieldStatus, value: copy.ready },
    ],
    sourceReceipts: [variant ? "BINET USA / FAITHAI BISPECIFIC GUIDANCE / LOCAL UNTIL YOU SAVE OR EXPORT." : intentId === "agriculture" || intentId === "aid" || intentId === "books" ? copy.sourceReviewed : copy.sourceLocal],
    privacyStatus: privateSafety ? copy.privateSafety : copy.privateLocal,
    textLabels: { savePoint: copy.savePoint, receipt: copy.receiptLabel, privacy: copy.fieldPrivacy, sources: copy.sourcesLabel, noAccount: copy.noAccountLine },
    createdAt: now,
    exportFormats: ["text/plain", "print"],
    path: INTENT_PATHS[intentId],
    contentVariant: variant ? "binet" : "general",
  };
}

export function walkthroughReducer(state, action) {
  const updatedAt = isoNow(action);
  switch (action.type) {
    case "boot":
      return { ...state, scene: WALKTHROUGH_SCENES.LISTEN, checkpoint: WALKTHROUGH_SCENES.LISTEN, updatedAt, exchangeCount: state.exchangeCount + 1 };
    case "instructions":
      return { ...state, scene: WALKTHROUGH_SCENES.INSTRUCTIONS, updatedAt };
    case "continue":
      return { ...state, scene: WALKTHROUGH_SCENES.LISTEN, checkpoint: WALKTHROUGH_SCENES.LISTEN, updatedAt };
    case "interpret": {
      const result = action.result || {};
      if (!INTENT_IDS.includes(result.intent) || result.confidence < 0.7 || result.ambiguous) {
        return { ...state, scene: WALKTHROUGH_SCENES.CHOOSE, pendingIntent: null, menuPage: 1, updatedAt, exchangeCount: state.exchangeCount + 1 };
      }
      return {
        ...state,
        scene: WALKTHROUGH_SCENES.CONFIRM,
        pendingIntent: { id: result.intent, label: result.label || result.intent, sensitive: Boolean(result.sensitive), provenance: result.provenance || "local", contentVariant: result.contentVariant === "binet" ? "binet" : "general" },
        updatedAt,
        exchangeCount: state.exchangeCount + 1,
      };
    }
    case "confirm":
      if (!state.pendingIntent) return state;
      if (!action.accepted) return { ...state, scene: WALKTHROUGH_SCENES.CHOOSE, pendingIntent: null, menuPage: 1, updatedAt, exchangeCount: state.exchangeCount + 1 };
      return { ...state, scene: WALKTHROUGH_SCENES.ACT, confirmedIntent: state.pendingIntent, pendingIntent: null, checkpoint: WALKTHROUGH_SCENES.ACT, updatedAt, exchangeCount: state.exchangeCount + 1 };
    case "choose": {
      if (!INTENT_IDS.includes(action.intent)) return state;
      const copy = getWalkthroughCopy(state.locale);
      return {
        ...state,
        scene: WALKTHROUGH_SCENES.ACT,
        confirmedIntent: { id: action.intent, label: action.contentVariant === "binet" && copy.binet?.intentLabels?.[action.intent] ? copy.binet.intentLabels[action.intent] : copy.intentLabels[action.intent], sensitive: action.intent === "safety", provenance: "numbered-choice", contentVariant: action.contentVariant === "binet" ? "binet" : "general" },
        pendingIntent: null,
        checkpoint: WALKTHROUGH_SCENES.ACT,
        updatedAt,
        exchangeCount: state.exchangeCount + 1,
      };
    }
    case "menu-page":
      return { ...state, scene: WALKTHROUGH_SCENES.CHOOSE, menuPage: action.page === 2 ? 2 : 1, updatedAt, exchangeCount: state.exchangeCount + 1 };
    case "act": {
      if (!state.confirmedIntent) return state;
      const artifactDraft = createWalkthroughArtifact(state.confirmedIntent.id, action.actionId, state.locale, updatedAt, state.confirmedIntent.contentVariant);
      return { ...state, scene: WALKTHROUGH_SCENES.RECEIPT, artifactDraft, checkpoint: WALKTHROUGH_SCENES.RECEIPT, saveStatus: "unsaved", updatedAt, exchangeCount: state.exchangeCount + 1 };
    }
    case "save":
      if (!state.artifactDraft || state.confirmedIntent?.id === "safety") return state;
      return { ...state, saveStatus: "saved", checkpoint: WALKTHROUGH_SCENES.RECEIPT, updatedAt };
    case "export":
      return { ...state, updatedAt };
    case "open-tool":
      return { ...state, requestedTool: action.tool || null, updatedAt };
    case "cancel":
      return { ...state, scene: WALKTHROUGH_SCENES.LISTEN, pendingIntent: null, artifactDraft: null, requestedTool: null, updatedAt };
    case "quick-exit":
      return createWalkthroughState(state.locale, updatedAt);
    case "set-locale":
      return { ...state, locale: action.locale, updatedAt };
    case "next":
      return { ...createWalkthroughState(state.locale, updatedAt), scene: WALKTHROUGH_SCENES.LISTEN, checkpoint: WALKTHROUGH_SCENES.LISTEN, exchangeCount: 0 };
    case "back": {
      const backScene = {
        [WALKTHROUGH_SCENES.INSTRUCTIONS]: WALKTHROUGH_SCENES.BOOT,
        [WALKTHROUGH_SCENES.LISTEN]: WALKTHROUGH_SCENES.BOOT,
        [WALKTHROUGH_SCENES.CONFIRM]: WALKTHROUGH_SCENES.LISTEN,
        [WALKTHROUGH_SCENES.CHOOSE]: state.menuPage === 2 ? WALKTHROUGH_SCENES.CHOOSE : WALKTHROUGH_SCENES.LISTEN,
        [WALKTHROUGH_SCENES.ACT]: WALKTHROUGH_SCENES.CHOOSE,
        [WALKTHROUGH_SCENES.RECEIPT]: WALKTHROUGH_SCENES.ACT,
      }[state.scene] || WALKTHROUGH_SCENES.BOOT;
      return { ...state, scene: backScene, menuPage: state.scene === WALKTHROUGH_SCENES.CHOOSE && state.menuPage === 2 ? 1 : state.menuPage, artifactDraft: backScene === WALKTHROUGH_SCENES.ACT ? null : state.artifactDraft, updatedAt };
    }
    case "restart":
      return createWalkthroughState(state.locale, updatedAt);
    case "restore":
      return normalizeWalkthroughState(action.state, state.locale, updatedAt);
    default:
      return state;
  }
}

export function normalizeWalkthroughState(value, fallbackLocale = "en", now = new Date().toISOString()) {
  if (!value || value.version !== WALKTHROUGH_VERSION || !Object.values(WALKTHROUGH_SCENES).includes(value.scene)) return createWalkthroughState(fallbackLocale, now);
  const confirmedIntent = INTENT_IDS.includes(value.confirmedIntent?.id) ? value.confirmedIntent : null;
  const artifactDraft = value.artifactDraft?.id && confirmedIntent ? value.artifactDraft : null;
  const resumedScene = value.scene === WALKTHROUGH_SCENES.RECEIPT && !artifactDraft ? WALKTHROUGH_SCENES.ACT : value.scene;
  return {
    ...createWalkthroughState(value.locale || fallbackLocale, value.createdAt || now),
    scene: confirmedIntent ? resumedScene : WALKTHROUGH_SCENES.BOOT,
    confirmedIntent,
    artifactDraft,
    checkpoint: value.checkpoint || value.scene,
    menuPage: value.menuPage === 2 ? 2 : 1,
    exchangeCount: Number.isInteger(value.exchangeCount) ? Math.max(0, value.exchangeCount) : 0,
    saveStatus: value.saveStatus === "saved" && artifactDraft ? "saved" : "unsaved",
    updatedAt: value.updatedAt || now,
  };
}

export function toPersistedWalkthrough(state) {
  const safeBase = {
    version: WALKTHROUGH_VERSION,
    locale: state.locale,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
  };
  if (!state.confirmedIntent || state.confirmedIntent.id === "safety" || (state.confirmedIntent.contentVariant === "binet" && state.saveStatus !== "saved")) {
    return { ...safeBase, scene: WALKTHROUGH_SCENES.BOOT, checkpoint: WALKTHROUGH_SCENES.BOOT, confirmedIntent: null, artifactDraft: null, menuPage: 1, exchangeCount: 0, saveStatus: "unsaved" };
  }
  return {
    ...safeBase,
    scene: state.scene,
    checkpoint: state.checkpoint,
    confirmedIntent: state.confirmedIntent,
    artifactDraft: state.saveStatus === "saved" ? state.artifactDraft : null,
    menuPage: state.menuPage,
    exchangeCount: state.exchangeCount,
    saveStatus: state.saveStatus,
  };
}

export function artifactToText(artifact) {
  if (!artifact) return "";
  const labels = artifact.textLabels || { savePoint: "FAITHAI SAVE POINT", receipt: "RECEIPT", privacy: "PRIVACY", sources: "SOURCES", noAccount: "NO ACCOUNT / NO SCORE / NOTHING SENT" };
  return [
    `FAITHAI / ${labels.savePoint}`,
    artifact.title,
    `${labels.receipt} ${artifact.id}`,
    ...artifact.fields.map((field) => `${field.label}: ${field.value}`),
    `${labels.privacy}: ${artifact.privacyStatus}`,
    `${labels.sources}:`,
    ...artifact.sourceReceipts.map((source) => `- ${source}`),
    labels.noAccount,
  ].join("\n");
}

/**
 * @typedef {object} WalkthroughState
 * @property {number} version
 * @property {string} scene
 * @property {string} locale
 * @property {{id:string,label:string,sensitive:boolean,provenance:string}|null} confirmedIntent
 * @property {WalkthroughArtifact|null} artifactDraft
 * @property {string} checkpoint
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string} saveStatus
 *
 * @typedef {{type:"boot"|"instructions"|"continue"|"interpret"|"confirm"|"choose"|"menu-page"|"act"|"save"|"export"|"open-tool"|"cancel"|"restart"|"quick-exit"|"back"|"next"|"set-locale"|"restore", [key:string]:unknown}} WalkthroughAction
 *
 * @typedef {object} WalkthroughArtifact
 * @property {string} id
 * @property {string} kind
 * @property {string} title
 * @property {{label:string,value:string}[]} fields
 * @property {string[]} sourceReceipts
 * @property {string} privacyStatus
 * @property {string} createdAt
 * @property {string[]} exportFormats
 */
