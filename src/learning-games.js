/** Small authored learning activities; progress is session-only until Save. */
export const LEARNING_GAMES = [
  {
    id: "read-and-match", title: "Read and match", option: 2, choice: 2,
    steps: [
      { prompt: "A note says: Keep this packet dry. Where would you put it?", choices: ["On a dry shelf under cover", "On a wet floor"], answer: 1, explanation: "Dry means away from water. A covered dry shelf fits the instruction." },
      { prompt: "A note says: Ask before sharing. What is the next step?", choices: ["Share it now", "Ask the person first"], answer: 2, explanation: "Ask before sharing means get permission before passing it on." },
    ],
    action: "Choose one instruction you use today. Read it, explain it in your own words, then choose the next action.",
  },
  {
    id: "garden-plan", title: "Plan a small garden", option: 5, choice: 2,
    steps: [
      { prompt: "You have a small growing space. What should you check first?", choices: ["Space, sunlight and available water", "Buy plants without checking"], answer: 1, explanation: "Observe your space before choosing plants. Local conditions matter." },
      { prompt: "You are unsure what grows well locally. Which source helps?", choices: ["An unverified promise", "A local extension service or reviewed local guide"], answer: 2, explanation: "A local extension service or reviewed guide can help you choose for the season and place." },
    ],
    action: "Write down the space, sunlight and water you have. Use a reviewed local growing guide before choosing what to plant.",
  },
];

export function answerLearningStep(game, step, choice) {
  const item = game?.steps[step];
  if (!item || !Number.isInteger(choice) || choice < 1 || choice > item.choices.length) return null;
  return { accepted: choice === item.answer, explanation: choice === item.answer ? item.explanation : "Take another look at the instruction. You can try either number again." };
}

export function learningReceipt(game, now = new Date()) {
  return { id: `PLAY-${game.id}-${now.getTime()}`, type: "learning", option: game.option, choice: game.choice, label: "Learning activity", choiceLabel: game.title, step: game.action, locale: "en", savedAt: now.toISOString(), storage: "this device only" };
}
