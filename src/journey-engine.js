export const JOURNEY_STAGES = ["choose", "focus", "save", "do"];
export const JOURNEY_LANES = ["now", "next", "later", "done"];

export function getJourneyState({ selectedId, focusId, receipt }) {
  if (selectedId === null || selectedId === undefined) return { active: 0, completed: 0 };
  if (focusId === null || focusId === undefined) return { active: 1, completed: 1 };
  if (!receipt) return { active: 2, completed: 2 };
  if (!receipt.completedAt) return { active: 3, completed: 3 };
  return { active: 3, completed: 4 };
}

export function getJourneySummary(history) {
  return normalizeJourneyHistory(history).reduce((summary, receipt) => ({
    saved: summary.saved + 1,
    done: summary.done + (receipt.lane === "done" ? 1 : 0),
    now: summary.now + (receipt.lane === "now" ? 1 : 0),
    next: summary.next + (receipt.lane === "next" ? 1 : 0),
    later: summary.later + (receipt.lane === "later" ? 1 : 0),
  }), { saved: 0, done: 0, now: 0, next: 0, later: 0 });
}

export function normalizeJourneyHistory(history) {
  let claimedNow = false;
  let assignedLegacyNow = false;
  return history.map((receipt) => {
    if (receipt.completedAt) return { ...receipt, lane: "done" };
    if (JOURNEY_LANES.slice(0, 3).includes(receipt.lane)) {
      if (receipt.lane !== "now") return receipt;
      if (!claimedNow) {
        claimedNow = true;
        return receipt;
      }
      return { ...receipt, lane: "next" };
    }
    if (!assignedLegacyNow && !claimedNow) {
      assignedLegacyNow = true;
      claimedNow = true;
      return { ...receipt, lane: "now" };
    }
    return { ...receipt, lane: "next" };
  });
}

export function getJourneyBoard(history) {
  const normalized = normalizeJourneyHistory(history);
  const board = { now: [], next: [], later: [], done: [] };
  normalized.forEach((receipt) => board[receipt.lane].push(receipt));
  return {
    ...board,
    items: [...board.now, ...board.next, ...board.later, ...board.done].slice(0, 9),
  };
}

export function getReturnReceipt(history) {
  const board = getJourneyBoard(history);
  return board.now[0] ?? board.next[0] ?? board.later[0] ?? null;
}
