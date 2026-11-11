import { useEffect, useMemo, useRef, useState } from "react";
import { GuideProvider } from "./guide-provider.js";
import { LANGUAGES } from "./i18n.js";
import { createLocalSound } from "./local-sound.js";
import { loadWalkthroughState, savePathReceipt, saveWalkthroughState, STORAGE_KEYS } from "./local-state.js";
import { createSpeechPort } from "./speech-port.js";
import { experienceForHostname } from "./experience-lane.js";
import { getWalkthroughCopy } from "./walkthrough-copy.js";
import { LearningGames } from "./LearningGames.jsx";
import { canOfferRemoteGuide, createRemoteGuideClient } from "./remote-guide.js";
import { artifactToText, WALKTHROUGH_SCENES, walkthroughReducer } from "./walkthrough-engine.js";

const MAIN_INTENTS = ["care", "learning", "tools", "project", "support", "books", "agriculture", "aid", "safety"];
const MORE_INTENTS = ["challenges", "power"];
const BINET_INTENTS = ["support", "safety", "care", "tools", "project"];
const SPEECH_LOCALES = { en: "en-US", es: "es-ES", fr: "fr-FR", sw: "sw-KE", ar: "ar" };

const CONSTELLATIONS = {
  boot: "        .       *\n    *       .       +\n        .       .",
  instructions: "    .---.       *\n  .'     '.   .\n *         *",
  listen: "        *\n    .---+---.\n  .     |     .",
  confirm: "    *---+---*\n        |\n    .---+---.",
  choose: "  *---.   .---*\n      \   /\n       \ +",
  act: "      *   *\n       \ /\n    .---+---.",
  receipt: "    *-------*\n    | SAVE  |\n    *-------*",
};

function initializeState() {
  if (experienceForHostname(window.location.hostname) === "binet" || import.meta.env.VITE_EXPERIENCE === "binet") return loadWalkthroughState({ getItem: () => null }, "en");
  let locale = "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.language);
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    locale = LANGUAGES.some((item) => item.code === saved) ? saved : LANGUAGES.some((item) => item.code === browser) ? browser : "en";
    return loadWalkthroughState(window.localStorage, locale);
  } catch {
    return loadWalkthroughState({ getItem: () => null }, locale);
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => navigator.connection?.saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(navigator.connection?.saveData || media.matches));
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useTypedMessage(message, reducedMotion) {
  const [visible, setVisible] = useState(message);
  const [complete, setComplete] = useState(true);
  useEffect(() => {
    if (reducedMotion) { setVisible(message); setComplete(true); return undefined; }
    let index = 0;
    setVisible("");
    setComplete(false);
    const delay = Math.max(3, Math.min(11, Math.floor(1200 / Math.max(1, message.length))));
    const timer = window.setInterval(() => {
      index += 1;
      setVisible(message.slice(0, index));
      if (index >= message.length) { window.clearInterval(timer); setComplete(true); }
    }, delay);
    return () => window.clearInterval(timer);
  }, [message, reducedMotion]);
  return { visible, complete, skip: () => { setVisible(message); setComplete(true); } };
}

function NeutralWeatherNotes({ onReturn }) {
  return (
    <main className="neutral-exit" aria-labelledby="walkthrough-weather-heading">
      <p className="wordmark">WEATHER NOTES</p>
      <h1 id="walkthrough-weather-heading">Simple weather preparation</h1>
      <ol><li>Check an official local forecast when available.</li><li>Keep drinking water and a charged light ready.</li><li>Choose a time to check conditions again.</li></ol>
      <p>No location was requested or shared.</p>
      <button type="button" onClick={onReturn}>[0] CLOSE NOTES</button>
    </main>
  );
}

function createJourneyReceipt(artifact, locale) {
  return {
    id: artifact.id,
    type: "walkthrough",
    option: artifact.path.option,
    label: artifact.title,
    choice: artifact.path.choice,
    choiceLabel: artifact.title.split(" / ")[1] || artifact.title,
    step: artifact.fields[0].value,
    locale,
    savedAt: artifact.createdAt,
    storage: "this device only",
  };
}

function downloadArtifact(artifact) {
  const url = URL.createObjectURL(new Blob([`${artifactToText(artifact)}\n`], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `faithai-save-point-${artifact.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildScene(state, copy, experience) {
  const binet = experience === "binet" ? getWalkthroughCopy("en").binet : null;
  const labelFor = (intent) => binet?.intentLabels?.[intent] || copy.intentLabels[intent];
  if (state.scene === WALKTHROUGH_SCENES.BOOT) return {
    kicker: binet?.brand || copy.online,
    title: binet?.saveWorld || copy.saveWorld,
    body: binet ? "PRIVATE BY DEFAULT. THIS DEVICE DOES NOT SAVE THE CHOICE. YOUR BROWSER HISTORY OR NETWORK MAY STILL SHOW THIS WEBSITE." : "",
    options: [["1", copy.homeStart], ["2", copy.homeContinue], ["3", copy.homeHelp], ["4", copy.homePlay], ["I", copy.instructions], [binet ? "G" : "U", binet ? "GENERAL FAITHAI" : "BINET USA"]],
  };
  if (state.scene === WALKTHROUGH_SCENES.INSTRUCTIONS) return {
    kicker: `I / ${copy.instructions}`,
    title: binet?.instructions || copy.instructionsBody[0],
    body: binet ? "CHOOSE A NUMBER, TYPE, OR SPEAK. NO ORIENTATION DATA IS SENT, TRACKED, OR SAVED BY THIS CHOICE.\n\nTHIS SITE NAME CAN APPEAR IN BROWSER HISTORY OR NETWORK LOGS. ONLY A CARD YOU EXPLICITLY SAVE STAYS ON THIS DEVICE." : copy.instructionsBody.slice(1).join("\n"),
    options: [["S", binet?.start || copy.start], ["0", copy.back]],
  };
  if (state.scene === WALKTHROUGH_SCENES.LISTEN) return {
    kicker: binet ? "BINET USA / 01 / LISTEN" : "01 / LISTEN",
    title: binet ? `${binet.opening}\n${binet.listen}` : `${copy.opening}\n${copy.listen}`,
    body: binet?.listenHint || copy.listenHint,
    options: binet
      ? BINET_INTENTS.map((intent, index) => [String(index + 1), labelFor(intent)]).concat([["G", "GENERAL FAITHAI"]])
      : [["1", copy.intentLabels.care], ["2", copy.intentLabels.learning], ["3", copy.intentLabels.tools], ["4", copy.intentLabels.project], ["5", copy.intentLabels.support], ["6", copy.more]],
  };
  if (state.scene === WALKTHROUGH_SCENES.CONFIRM) return {
    kicker: "02 / CONFIRM", title: `${copy.heard}: ${state.pendingIntent?.label || "?"}.`, body: copy.confirm, options: [["1", copy.yes], ["2", copy.change], ["0", copy.back]],
  };
  if (state.scene === WALKTHROUGH_SCENES.CHOOSE) {
    const intents = binet ? BINET_INTENTS : state.menuPage === 2 ? MORE_INTENTS : MAIN_INTENTS;
    return {
      kicker: binet ? "BINET USA / 03 / CHOOSE" : "03 / CHOOSE",
      title: binet ? "CHOOSE WHAT WOULD HELP RIGHT NOW." : copy.choose,
      body: binet ? "YOU DO NOT HAVE TO EXPLAIN YOUR IDENTITY TO USE THIS LANE." : state.menuPage === 1 ? copy.ambiguous : copy.more,
      options: [...intents.map((intent, index) => [String(index + 1), labelFor(intent)]), ["0", binet || state.menuPage === 2 ? copy.back : copy.more]],
    };
  }
  if (state.scene === WALKTHROUGH_SCENES.ACT) {
    const intent = state.confirmedIntent?.id;
    const actions = state.confirmedIntent?.contentVariant === "binet" ? binet?.actions : copy.actions;
    return {
      kicker: `${binet && state.confirmedIntent?.contentVariant === "binet" ? "BINET USA / " : ""}04 / ACT / ${labelFor(intent) || ""}`,
      title: binet && state.confirmedIntent?.contentVariant === "binet" ? "CHOOSE ONE SMALL ACTION FOR YOUR WORLD." : copy.act,
      body: intent === "safety" ? copy.safetyNote : "",
      options: (actions?.[intent] || []).map((action, index) => [String(index + 1), action[0]]).concat([["0", copy.back]]),
    };
  }
  const artifact = state.artifactDraft;
  return {
    kicker: "05 / RECEIPT", title: copy.savePoint, body: artifact ? artifactToText(artifact) : "", options: [["S", copy.save], ["E", copy.export], ["N", copy.next], ["H", copy.journey], ["0", copy.back]],
  };
}

export function TerminalWalkthrough({ onClassic, onOpenClassic, active = true, onExperienceChange }) {
  const [state, setState] = useState(initializeState);
  const [experience, setExperience] = useState(() => import.meta.env.VITE_EXPERIENCE || experienceForHostname(window.location.hostname));
  const [playOpen, setPlayOpen] = useState(false);
  const [generalLocale, setGeneralLocale] = useState(null);
  const [input, setInput] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [notice, setNotice] = useState("");
  const [speechDisclosure, setSpeechDisclosure] = useState(false);
  const [speechConsented, setSpeechConsented] = useState(false);
  const [listening, setListening] = useState(false);
  const [languageMenu, setLanguageMenu] = useState(false);
  const [neutralExit, setNeutralExit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [remoteAvailable, setRemoteAvailable] = useState(false);
  const [remotePreview, setRemotePreview] = useState(null);
  const guideRef = useRef(new GuideProvider());
  const remoteRef = useRef(null);
  const remoteVersion = useRef(0);
  if (!remoteRef.current) remoteRef.current = createRemoteGuideClient({ base: import.meta.env.VITE_API_BASE });
  const speechRef = useRef(createSpeechPort(window));
  const soundRef = useRef(createLocalSound(window));
  const inputRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const copy = getWalkthroughCopy(state.locale);
  const scene = useMemo(() => buildScene(state, copy, experience), [copy, experience, state]);
  const fullMessage = [scene.kicker, scene.title, scene.body].filter(Boolean).join("\n\n");
  const typed = useTypedMessage(fullMessage, reducedMotion);

  useEffect(() => {
    onExperienceChange?.(experience);
  }, [experience, onExperienceChange]);

  useEffect(() => {
    let current = true;
    setRemoteAvailable(false);
    if (active && experience === "general") remoteRef.current.checkAvailability().then((ready) => { if (current) setRemoteAvailable(ready); });
    return () => { current = false; };
  }, [active, experience]);

  useEffect(() => {
    if (!active) { speechRef.current.cancel(); setListening(false); return; }
    document.documentElement.lang = state.locale;
    document.documentElement.dir = copy.dir;
    document.title = "FAITHAI — Guided Save Point";
  }, [active, copy.dir, state.locale]);

  useEffect(() => {
    if (!state.confirmedIntent || state.confirmedIntent.id === "safety") return;
    if (state.confirmedIntent.contentVariant === "binet" && state.saveStatus !== "saved") return;
    if (state.scene !== WALKTHROUGH_SCENES.ACT && state.saveStatus !== "saved") return;
    try {
      saveWalkthroughState(window.localStorage, state);
      if (state.saveStatus === "saved" && state.artifactDraft) savePathReceipt(window.localStorage, createJourneyReceipt(state.artifactDraft, state.locale));
    } catch {
      setNotice("LOCAL STORAGE IS UNAVAILABLE. EXPORT STILL WORKS.");
    }
  }, [state]);

  useEffect(() => {
    const skipTyping = (event) => {
      if (!active || typed.complete || !["Enter", " "].includes(event.key)) return;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName)) return;
      event.preventDefault();
      typed.skip();
    };
    window.addEventListener("keydown", skipTyping);
    return () => window.removeEventListener("keydown", skipTyping);
  }, [active, typed]);

  const transition = (action, sound = "move") => {
    setState((current) => walkthroughReducer(current, { ...action, now: new Date().toISOString() }));
    soundRef.current.play(sound);
    setNotice("");
  };

  const chooseExperience = (nextExperience) => {
    const nextLocale = nextExperience === "binet" ? "en" : generalLocale || state.locale;
    if (nextExperience === "binet") setGeneralLocale(state.locale);
    setExperience(nextExperience);
    setState((current) => {
      const now = new Date().toISOString();
      const restarted = walkthroughReducer(current, { type: "restart", now });
      return walkthroughReducer(restarted, { type: "set-locale", locale: nextLocale, now });
    });
    soundRef.current.play("confirm");
    setNotice("");
    setLastInput("");
    setRemotePreview(null);
  };

  const setLocale = (locale) => {
    transition({ type: "set-locale", locale }, "confirm");
    setLanguageMenu(false);
    try { window.localStorage.setItem(STORAGE_KEYS.language, locale); } catch { /* Session language remains active. */ }
  };

  const startSpeech = () => {
    if (listening) { speechRef.current.cancel(); setListening(false); return; }
    if (!speechRef.current.supported) { setNotice(copy.speechUnavailable); return; }
    speechRef.current.start({
      locale: SPEECH_LOCALES[state.locale] || "en-US",
      onInterim: (value) => setInput(value),
      onFinal: (value) => { setInput(value); setNotice(copy.transcriptReady); inputRef.current?.focus(); },
      onError: (error) => setNotice(error === "not-allowed" ? "MICROPHONE PERMISSION WAS NOT GRANTED. TYPING STILL WORKS." : copy.speechUnavailable),
      onState: ({ listening: active }) => setListening(active),
    });
  };

  const requestSpeech = () => {
    if (speechConsented) { startSpeech(); return; }
    setSpeechDisclosure(true);
    setNotice("");
  };

  const saveArtifact = () => {
    if (!state.artifactDraft) return;
    if (state.confirmedIntent?.id === "safety") { setNotice(copy.privateReceipt); return; }
    transition({ type: "save" }, "save");
    setNotice(copy.saved);
  };

  const exportArtifact = () => {
    if (!state.artifactDraft) return;
    downloadArtifact(state.artifactDraft);
    soundRef.current.play("save");
    setNotice(copy.exported);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    soundRef.current.setEnabled(next);
    setSoundEnabled(next);
    if (next) soundRef.current.play("confirm");
    setNotice(next ? copy.soundOn : copy.soundOff);
  };

  const handleCommand = async (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return;
    const key = value.toLocaleLowerCase();
    if (key === "q") {
      remoteVersion.current += 1; remoteRef.current.cancel(); setBusy(false); setRemotePreview(null);
      speechRef.current.cancel(); setListening(false); transition({ type: "quick-exit" }, "back");
      setLastInput(""); setInput(""); setNeutralExit(true); document.title = "Weather notes"; return;
    }
    if (busy) return;
    setLastInput(value);
    setInput("");

    if (remotePreview) {
      if (!["1", "2", "0", "n", "no"].includes(key)) return;
      const preview = remotePreview;
      setRemotePreview(null);
      setLastInput("");
      if (key === "0") return;
      setBusy(true);
      const version = ++remoteVersion.current;
      try {
        const result = key === "1" ? await remoteRef.current.interpretApproved({ approvedUtterance: preview.utterance, consent: true, locale: state.locale, experience, localResult: preview.localResult }) : preview.localResult;
        if (remoteVersion.current !== version) return;
        transition({ type: "interpret", result: { ...result, label: copy.intentLabels[result.intent], contentVariant: "general" } });
        if (key === "1" && result.provenance !== "remote") setNotice("Online AI is unavailable or not eligible. Your numbered local guide still works.");
      } finally { setBusy(false); }
      return;
    }

    if (!experience) {
      if (["1", "g", "general", "faithai"].includes(key)) chooseExperience("general");
      else if (["2", "b", "bi", "bisexual", "binet"].includes(key)) chooseExperience("binet");
      return;
    }

    if (languageMenu) {
      if (key === "0") setLanguageMenu(false);
      else if (/^[1-5]$/.test(key)) setLocale(LANGUAGES[Number(key) - 1].code);
      return;
    }
    if (speechDisclosure) {
      if (["1", "y", "yes"].includes(key)) { setSpeechDisclosure(false); setSpeechConsented(true); window.setTimeout(startSpeech, 0); }
      else if (["2", "0", "n", "no"].includes(key)) setSpeechDisclosure(false);
      return;
    }

    if (key === "g" && experience === "binet") { chooseExperience("general"); return; }
    if (key === "u" && experience === "general") { chooseExperience("binet"); return; }
    if (key === "v") { requestSpeech(); return; }
    if (key === "l") {
      if (experience === "binet") { setNotice("BINET USA IS IN ENGLISH IN THIS FIRST RELEASE. GENERAL FAITHAI HAS THE BUNDLED LANGUAGE PACKS."); return; }
      setLanguageMenu(true);
      return;
    }
    if (key === "m") { onOpenClassic("help"); return; }
    if (key === "h") { onOpenClassic("history"); return; }
    if (key === "a") { onOpenClassic("signals"); return; }
    if (key === "c") { onClassic(); return; }
    if (key === "b") { toggleSound(); return; }
    if (key === "p") { setPlayOpen(true); return; }

    if (state.scene === WALKTHROUGH_SCENES.BOOT) {
      if (["s", "1", "save"].includes(key)) transition({ type: "boot" }, "confirm");
      else if (key === "2") onOpenClassic("history");
      else if (key === "3") onOpenClassic("help");
      else if (key === "4") setPlayOpen(true);
      else if (key === "i") transition({ type: "instructions" });
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.INSTRUCTIONS) {
      if (["s", "1"].includes(key)) transition({ type: "continue" }, "confirm");
      else if (key === "0") transition({ type: "back" }, "back");
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.LISTEN) {
      const intents = experience === "binet" ? BINET_INTENTS : MAIN_INTENTS;
      if (/^[1-5]$/.test(key)) { transition({ type: "choose", intent: intents[Number(key) - 1], contentVariant: experience === "binet" ? "binet" : "general" }, "confirm"); return; }
      if (key === "6") { transition({ type: "interpret", result: { intent: null, confidence: 0, ambiguous: true } }); return; }
      if (key === "0") { transition({ type: "back" }, "back"); return; }
      setBusy(true);
      try {
        const result = await guideRef.current.interpret({ utterance: value, locale: state.locale, scene: state.scene, remoteConsent: false });
        if (remoteAvailable && canOfferRemoteGuide({ utterance: value, locale: state.locale, experience, localResult: result })) {
          setRemotePreview({ utterance: value, localResult: result });
          return;
        }
        transition({ type: "interpret", result: { ...result, contentVariant: experience === "binet" ? "binet" : "general" } }, result.ambiguous ? "move" : "confirm");
      } finally { setBusy(false); }
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.CONFIRM) {
      if (["1", "y", "yes", "si", "sí", "oui", "ndiyo", "نعم"].includes(key)) transition({ type: "confirm", accepted: true }, "confirm");
      else if (["2", "n", "no", "change"].includes(key)) transition({ type: "confirm", accepted: false }, "back");
      else if (key === "0") transition({ type: "back" }, "back");
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.CHOOSE) {
      const intents = experience === "binet" ? BINET_INTENTS : state.menuPage === 2 ? MORE_INTENTS : MAIN_INTENTS;
      if (key === "0") {
        if (experience === "binet") transition({ type: "back" }, "back");
        else transition({ type: "menu-page", page: state.menuPage === 2 ? 1 : 2 }, state.menuPage === 2 ? "back" : "move");
      } else if (/^[1-9]$/.test(key) && intents[Number(key) - 1]) transition({ type: "choose", intent: intents[Number(key) - 1], contentVariant: experience === "binet" ? "binet" : "general" }, "confirm");
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.ACT) {
      if (key === "0") transition({ type: "back" }, "back");
      else if (/^[1-2]$/.test(key)) transition({ type: "act", actionId: Number(key) }, "save");
      return;
    }
    if (state.scene === WALKTHROUGH_SCENES.RECEIPT) {
      if (key === "s") saveArtifact();
      else if (key === "e") exportArtifact();
      else if (key === "n") transition({ type: "next" }, "confirm");
      else if (key === "0") transition({ type: "back" }, "back");
    }
  };

  if (neutralExit) return <NeutralWeatherNotes onReturn={() => { setNeutralExit(false); document.title = "FAITHAI — Guided Save Point"; }} />;
  if (playOpen) return <LearningGames experience={experience} onClose={() => setPlayOpen(false)} onJourney={() => onOpenClassic("history")} />;

  if (!experience) return (
    <main className="terminal-shell terminal-entry-shell" dir="ltr" lang="en" data-experience="choose">
      <a className="skip-link" href="#terminal-input">SKIP TO INPUT</a>
      <header className="terminal-status" aria-label="FAITHAI starting choices">
        <span>FAITHAI / CHOOSE A START</span>
        <span>NO ACCOUNT / NOTHING SENT</span>
      </header>
      <section className="terminal-stage terminal-entry" aria-labelledby="experience-heading">
        <p className="terminal-entry-kicker">TWO DOORS. YOUR CHOICE IS NOT SAVED.</p>
        <h1 id="experience-heading">WHERE DO YOU WANT TO BEGIN?</h1>
        <div className="terminal-entry-grid">
          <button className="terminal-entry-card terminal-entry-card--binet" type="button" onClick={() => chooseExperience("binet")}>
            <span>[2] BINET USA</span>
            <strong>BISEXUAL, ARE YOU READY TO SAVE YOUR WORLD?</strong>
            <small>Bispecific care, privacy, connection, work, and world-building. Private by default.</small>
          </button>
          <button className="terminal-entry-card terminal-entry-card--general" type="button" onClick={() => chooseExperience("general")}>
            <span>[1] FAITHAI</span>
            <strong>WOULD YOU LIKE TO SAVE THE WORLD?</strong>
            <small>General help, learning, tools, projects, aid, and community pathways for everyone.</small>
          </button>
        </div>
      </section>
      <form className="terminal-composer" onSubmit={(event) => { event.preventDefault(); handleCommand(input); }}>
        <label className="sr-only" htmlFor="terminal-input">Choose a start</label>
        <span aria-hidden="true">&gt;</span>
        <input id="terminal-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder="PRESS 1 FOR FAITHAI OR 2 FOR BINET USA" autoComplete="off" enterKeyHint="send" />
        <button type="submit" disabled={!input.trim()}>ENTER</button>
      </form>
      <footer className="terminal-command-line">[1] GENERAL FAITHAI / [2] BINET USA / CHOICE STAYS IN THIS SESSION</footer>
    </main>
  );

  const shownOptions = remotePreview
    ? [["1", "US pilot: send this text once"], ["2", "Keep guidance on this device"], ["0", "Change my text"], ["Q", "Quick exit"]]
    : languageMenu
    ? LANGUAGES.map((language) => [String(language.number), language.label]).concat([["0", copy.back]])
    : speechDisclosure
      ? [["1", copy.understand], ["2", copy.notNow]]
      : scene.options;
  const displayMessage = remotePreview
    ? `OPTIONAL ONLINE AI / US PILOT\n\nThe local guide is unsure. This optional English pilot is for use in the United States. Send only the text below to the configured AI provider to choose a help lane? No audio, journey history, saved cards or location will be sent. FAITHAI does not store this text. The provider receives this request.\n\nTEXT TO SEND:\n${remotePreview.utterance}\n\n[1] chooses the US pilot and approves this request only. [2] keeps everything local. You do not need AI to continue.`
    : languageMenu
    ? `L / LANGUAGE\n\n${LANGUAGES.map((language) => `[${language.number}] ${language.label}`).join("  ")}`
    : speechDisclosure
      ? `V / ${copy.speak}\n\n${copy.speechDisclosure}`
      : fullMessage;
  const displayTyped = remotePreview || languageMenu || speechDisclosure ? displayMessage : typed.visible;

  return (
    <main className="terminal-shell" dir={copy.dir} lang={state.locale} data-scene={state.scene} data-experience={experience}>
      <a className="skip-link" href="#terminal-input">SKIP TO INPUT</a>
      <header className="terminal-status" aria-label="FAITHAI status">
        <span>{experience === "binet" ? "BINET USA / YOUR WORLD" : "FAITHAI / GENERAL LANE"} / {state.scene.toUpperCase()}</span>
        {busy ? <button type="button" onClick={() => handleCommand("q")}>[Q] EXIT</button> : null}
        <span>{soundEnabled ? "SOUND ON" : "SOUND OFF"} / LOCAL GUIDE</span>
      </header>

      <section className="terminal-stage" aria-label="FAITHAI guided walkthrough" onClick={() => !typed.complete && typed.skip()}>
        <pre className="terminal-constellation" aria-hidden="true">{CONSTELLATIONS[state.scene] || CONSTELLATIONS.boot}</pre>
        <div className="terminal-live sr-only" role="status" aria-live="polite" aria-atomic="true">{displayMessage}</div>
        <div className="terminal-copy" aria-hidden="true">
          <pre>{displayTyped}<span className="waiting-cursor">_</span></pre>
        </div>
        {lastInput && !remotePreview && !speechDisclosure && !languageMenu ? <p className="terminal-echo" aria-hidden="true">&gt; {lastInput.length > 70 ? `${lastInput.slice(0, 67)}...` : lastInput}</p> : null}
        <div className="terminal-options" aria-label="Available choices">
          {shownOptions.map(([key, label]) => <button type="button" key={`${key}-${label}`} onClick={() => handleCommand(key)}><span>[{key}]</span> {label}</button>)}
        </div>
        {notice ? <p className="terminal-notice" role="status">{notice}</p> : null}
        {listening ? <button className="listening-pill" type="button" onClick={requestSpeech}>{copy.listening}</button> : null}
      </section>

      <form className="terminal-composer" onSubmit={(event) => { event.preventDefault(); handleCommand(input); }}>
        <label className="sr-only" htmlFor="terminal-input">{copy.inputPlaceholder}</label>
        <span aria-hidden="true">&gt;</span>
        <input id="terminal-input" ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} placeholder={copy.inputPlaceholder} autoComplete="off" autoCapitalize="sentences" enterKeyHint="send" disabled={busy} />
        <button className="terminal-mic" type="button" disabled={Boolean(remotePreview) || busy} onClick={requestSpeech} aria-pressed={listening} aria-label={copy.speak}>[V]</button>
        <button type="submit" disabled={!input.trim() || busy}>{busy ? "..." : copy.send}</button>
      </form>
      <footer className="terminal-command-line">{copy.helpHint}</footer>
    </main>
  );
}
