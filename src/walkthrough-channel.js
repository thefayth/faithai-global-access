import { getWalkthroughCopy } from "./walkthrough-copy.js";
import { WALKTHROUGH_SCENES } from "./walkthrough-engine.js";

const MAIN_INTENTS = ["care", "learning", "tools", "project", "support", "books", "agriculture", "aid", "safety"];
const MORE_INTENTS = ["challenges", "power"];

function lines(title, options) {
  return [title, "", ...options.map(([number, label]) => `${number}. ${label}`)].join("\n");
}

/** Stable, numeric-only projection for SMS and USSD simulators. Speech is intentionally absent. */
export function createWalkthroughChannelScreen(state) {
  const copy = getWalkthroughCopy(state.locale);
  const stableId = `FAITHAI-WALKTHROUGH-V1-${state.scene.toUpperCase()}${state.scene === WALKTHROUGH_SCENES.CHOOSE ? `-P${state.menuPage}` : ""}`;
  let options = [];
  let title = "";

  if (state.scene === WALKTHROUGH_SCENES.BOOT) {
    title = `${copy.online}\n${copy.saveWorld}`;
    options = [[1, copy.start], [2, copy.instructions], [0, copy.back]];
  } else if (state.scene === WALKTHROUGH_SCENES.INSTRUCTIONS) {
    title = copy.instructionsBody.join(" ");
    options = [[1, copy.start], [0, copy.back]];
  } else if (state.scene === WALKTHROUGH_SCENES.LISTEN) {
    title = `${copy.opening} ${copy.listen}`;
    options = [[1, copy.intentLabels.care], [2, copy.intentLabels.learning], [3, copy.intentLabels.tools], [4, copy.intentLabels.project], [5, copy.intentLabels.support], [6, copy.more], [0, copy.back]];
  } else if (state.scene === WALKTHROUGH_SCENES.CONFIRM) {
    title = `${copy.heard}: ${state.pendingIntent?.label || "?"}. ${copy.confirm}`;
    options = [[1, copy.yes], [2, copy.change], [0, copy.back]];
  } else if (state.scene === WALKTHROUGH_SCENES.CHOOSE) {
    const intents = state.menuPage === 2 ? MORE_INTENTS : MAIN_INTENTS;
    title = copy.choose;
    options = intents.map((intent, index) => [index + 1, copy.intentLabels[intent]]).concat([[0, state.menuPage === 2 ? copy.back : copy.more]]);
  } else if (state.scene === WALKTHROUGH_SCENES.ACT) {
    title = `${copy.intentLabels[state.confirmedIntent?.id] || ""}\n${copy.act}`;
    options = (copy.actions[state.confirmedIntent?.id] || []).map((action, index) => [index + 1, action[0]]).concat([[0, copy.back]]);
  } else {
    title = `${copy.savePoint}\n${state.artifactDraft?.title || ""}`;
    options = [[1, copy.save], [2, copy.next], [3, copy.journey], [0, copy.back]];
  }

  return {
    sceneId: stableId,
    text: `${lines(title, options)}\n\nSCENE ${stableId}\nSIMULATION ONLY / NOTHING SENT`,
    options: options.map(([number, label]) => ({ number, label })),
    simulated: true,
  };
}
