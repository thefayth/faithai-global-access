export const DEMO_CIRCLE = {
  id: "circle-cheltenham-prototype",
  code: "PURPLE7",
  locale: "en",
  territory: "US-PA-Cheltenham",
  announcement: "Prototype circle: choose one cooperative action. No public profiles or direct messages.",
  moderationState: "prototype",
};

export const CHALLENGES = [
  { id: "garden-observation", circleId: DEMO_CIRCLE.id, title: "Garden observation", action: "Record one soil, water, crop, or pest observation and keep it local.", start: "2026-08-01", end: "2026-12-31", approvedTemplate: "agriculture-observation", moderationState: "prototype" },
  { id: "one-page-budget", circleId: DEMO_CIRCLE.id, title: "One-page budget", action: "List one essential cost, one flexible cost, and one question you want help answering.", start: "2026-08-01", end: "2026-12-31", approvedTemplate: "budgeting-private", moderationState: "prototype" },
  { id: "community-repair", circleId: DEMO_CIRCLE.id, title: "Community repair", action: "Name one small shared repair and one person or organization that can verify the need.", start: "2026-08-01", end: "2026-12-31", approvedTemplate: "community-repair", moderationState: "prototype" },
];

export const CHALLENGE_RESPONSES = ["done", "need_help", "later"];

export function normalizeCircleCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 24);
}

export async function hashCircleCode(code) {
  const bytes = new TextEncoder().encode(normalizeCircleCode(code));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function joinPrototypeCircle(code) {
  const [candidate, expected] = await Promise.all([hashCircleCode(code), hashCircleCode(DEMO_CIRCLE.code)]);
  return candidate === expected ? { ...DEMO_CIRCLE, code: undefined, codeHash: expected } : null;
}

export function recordChallengeProgress(progress, challengeId, response, at = new Date().toISOString()) {
  if (!CHALLENGE_RESPONSES.includes(response)) throw new Error("Unsupported challenge response.");
  return { ...progress, [challengeId]: { response, at } };
}

export function aggregateChallengeProgress(progressLists, challengeId) {
  return progressLists.reduce((totals, progress) => {
    const response = progress?.[challengeId]?.response;
    if (CHALLENGE_RESPONSES.includes(response)) totals[response] += 1;
    return totals;
  }, { done: 0, need_help: 0, later: 0 });
}
