import { useState } from "react";
import { LEARNING_GAMES, answerLearningStep, learningReceipt } from "./learning-games.js";
import { savePathReceipt } from "./local-state.js";

export function LearningGames({ experience, onClose, onJourney }) {
  const [game, setGame] = useState(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const complete = game && step >= game.steps.length;
  const command = (raw) => {
    const key = String(raw).trim().toLowerCase();
    setInput("");
    if (key === "q" || key === "0") { onClose(); return; }
    if (key === "h") { onJourney(); return; }
    if (!game) {
      const selected = LEARNING_GAMES[Number(key) - 1];
      if (selected) { setGame(selected); setStep(0); setFeedback(""); }
      return;
    }
    if (complete) {
      if (key === "s") {
        if (saved) return;
        try { savePathReceipt(localStorage, learningReceipt(game)); setSaved(true); setFeedback("Your next action is saved on this device. Open My Journey to return to it."); }
        catch { setFeedback("This device could not save. You can still copy the next action below."); }
      } else if (key === "n") { setGame(null); setStep(0); setFeedback(""); setAccepted(false); setSaved(false); }
      return;
    }
    if (accepted && key === "n") { setStep((value) => value + 1); setFeedback(""); setAccepted(false); return; }
    const result = answerLearningStep(game, step, Number(key));
    if (result) { setFeedback(result.explanation); setAccepted(result.accepted); }
  };
  const options = !game ? LEARNING_GAMES.map((item, index) => [String(index + 1), item.title]) : complete ? [["S", "Save my next action"], ["H", "My journey"], ["N", "Another activity"]] : accepted ? [["N", "Continue"]] : game.steps[step].choices.map((item, index) => [String(index + 1), item]);
  return (
    <main className="terminal-shell" data-experience={experience} dir="ltr" lang="en">
      <header className="terminal-status"><span>LEARN OR PLAY / OFFLINE ACTIVITIES</span><button type="button" onClick={onClose}>[0] Return</button></header>
      <section className="terminal-stage learning-activity" aria-labelledby="activity-heading">
        <p>English learning activities / no account required</p>
        <h1 id="activity-heading">{game?.title || "Try one small activity"}</h1>
        <p>{!game ? "Choose an activity. Take your time; there are no scores or timers." : complete ? game.action : game.steps[step].prompt}</p>
        {feedback ? <p className="terminal-notice" role="status">{feedback}</p> : null}
        <div className="terminal-options">{options.map(([key, label]) => <button type="button" key={key} onClick={() => command(key)}><span>[{key}]</span> {label}</button>)}</div>
      </section>
      <form className="terminal-composer" onSubmit={(event) => { event.preventDefault(); command(input); }}><label htmlFor="game-input">&gt;</label><input id="game-input" aria-label="Type a choice number or command" value={input} onChange={(event) => setInput(event.target.value)} autoComplete="off" /><button type="submit">Enter</button></form>
      <footer className="terminal-command-line">[0] RETURN / [H] MY JOURNEY / [Q] CLOSE ACTIVITY</footer>
    </main>
  );
}
