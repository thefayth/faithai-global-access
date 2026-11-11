import { SIGNAL_CATALOG } from "./faithai-data.js";

export function createPathReceipt(option, choice, now = new Date(), locale = "en") {
  const savedAt = now.toISOString();
  const timeCode = savedAt.replace(/\D/g, "").slice(4, 18);

  return {
    id: `F${option.id}${choice.id}-${timeCode}`,
    type: "path",
    option: option.id,
    label: option.label,
    choice: choice.id,
    choiceLabel: choice.label,
    step: choice.action,
    locale,
    savedAt,
    storage: "this device only",
  };
}

export function rankSignals(history) {
  const latestByPath = new Map();
  history.forEach((receipt, index) => {
    if (!latestByPath.has(receipt.option)) latestByPath.set(receipt.option, { receipt, index });
  });

  return SIGNAL_CATALOG
    .flatMap((signal) => {
      const context = latestByPath.get(signal.path);
      if (!context) return [];
      const recencyBoost = Math.max(0, 12 - context.index * 2);
      return [{
        ...signal,
        score: signal.score + recencyBoost,
        reason: `Saved path ${context.receipt.option}.${context.receipt.choice}: ${context.receipt.choiceLabel}.`,
        receiptId: context.receipt.id,
        contextOption: context.receipt.option,
        contextChoice: context.receipt.choice,
      }];
    })
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
}

export function createStepPacket(receipt, labels = {}) {
  const copy = {
    localStep: "FAITHAI LOCAL STEP", receipt: "RECEIPT", path: "PATH", focus: "FOCUS", next: "NEXT",
    status: "STATUS SAVED ON THIS DEVICE / NOT SENT", commands: "COMMANDS A SIGNALS / H HISTORY / 0 MENU",
    ...labels,
  };
  return [
    copy.localStep,
    `${copy.receipt} ${receipt.id}`,
    `${copy.path} ${receipt.option}.${receipt.choice} ${receipt.label}`,
    `${copy.focus} ${receipt.choiceLabel}`,
    `${copy.next} ${receipt.step}`,
    copy.status,
    copy.commands,
  ].join("\n");
}

export function createSignalPacket(signal, position, total, labels = {}) {
  const copy = {
    signalPreview: "FAITHAI SIGNAL PREVIEW", signal: "SIGNAL", of: "OF", priority: "PRIORITY", why: "WHY", next: "NEXT",
    syntheticStatus: "STATUS SYNTHETIC / NOTHING SENT OR ACTIVATED",
    signalCommands: "REPLY 1 DETAILS / 2 NEXT / 8 PREVIOUS / S SAVE / X MUTE",
    ...labels,
  };
  return [
    copy.signalPreview,
    `${copy.signal} ${position + 1} ${copy.of} ${total}`,
    `${copy.priority} ${signal.priority}`,
    signal.title,
    `${copy.why} ${signal.reason} ${signal.importance}`,
    `${copy.next} ${signal.action}`,
    copy.syntheticStatus,
    copy.signalCommands,
  ].join("\n");
}
