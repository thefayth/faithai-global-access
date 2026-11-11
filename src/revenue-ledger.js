export const REVENUE_LEDGER_TYPES = ["earned", "restricted", "power-credit"];

export function recordLedgerEntry(ledgers, type, entry) {
  if (!REVENUE_LEDGER_TYPES.includes(type)) throw new Error("Unknown ledger type.");
  if (type === "power-credit" && entry.cashAmount) throw new Error("Power Credits are noncash.");
  return { ...ledgers, [type]: [...(ledgers[type] || []), { ...entry, recordedAt: entry.recordedAt || new Date().toISOString() }] };
}
