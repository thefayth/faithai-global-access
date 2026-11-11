import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowCounterClockwise,
  BellRinging,
  Broadcast,
  CaretRight,
  CheckCircle,
  Circle,
  DeviceMobile,
  FloppyDisk,
  Info,
  LockKey,
} from "@phosphor-icons/react";
import { createPathReceipt, createSignalPacket, createStepPacket, rankSignals } from "./faithai-engine.js";
import { HelpHubPanel } from "./help-hub.jsx";
import { getJourneyBoard, getJourneyState, getJourneySummary } from "./journey-engine.js";
import {
  getLanguage,
  getLocalizedOptions,
  getPacketLabels,
  LANGUAGES,
  localizeSignal,
  toPhoneSafe,
  translate,
} from "./i18n.js";
import {
  clearFaithaiLocalData,
  completePathReceipt,
  loadHistory,
  movePathReceipt,
  savePathReceipt,
  saveSignalReceipt,
  STORAGE_KEYS,
} from "./local-state.js";

function useGlobalCommandMap(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const onKeyDown = (event) => handlerRef.current(event);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

function JourneyRail({ state, t }) {
  const stages = [t("stageChoose"), t("stageFocus"), t("stageSave"), t("stageDo")];
  return (
    <div className="journey-rail" aria-label={t("journeyTitle")}>
      <p>{t("journeyTitle")}</p>
      <ol>
        {stages.map((stage, index) => {
          const complete = index < state.completed;
          const active = index === state.active && !complete;
          return (
            <li className={complete ? "is-complete" : active ? "is-active" : ""} key={stage} aria-current={active ? "step" : undefined}>
              <span>{complete ? <CheckCircle weight="fill" aria-hidden="true" /> : index + 1}</span>
              {stage}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function PhoneTranscript({ options, selected, focus, infoOpen, savedReceipt, locale, asciiSafe, t }) {
  const menu = options.map((option) => `${option.id} ${option.label}`).join("\n");
  const focusMenu = selected?.choices.map((choice) => `${choice.id} ${choice.label}`).join("\n") ?? "";
  const journey = getJourneyState({ selectedId: selected?.id ?? null, focusId: focus?.id ?? null, receipt: savedReceipt });
  const transcript = `FAITHAI - ${t("brandInstitute")}

${t("phoneAsk")}
${menu}

${t("replyMain")}`;
  const result = selected ? `${t("path")} [${selected.id}] ${selected.label}
${t("chooseFocus")}:
${focusMenu}
${focus ? `
${t("selected")} [${selected.id}.${focus.id}]
${t("next")}: ${focus.action}` : ""}
${savedReceipt ? `
${t("savedAs", { id: savedReceipt.id })}` : ""}
${savedReceipt?.completedAt ? `
${t("checkpointComplete")}` : ""}
${infoOpen ? `
${t("who")}: ${selected.people}
${t("how")}: ${selected.detail}` : ""}

${t("replyFocus", { count: selected.choices.length })}` : "";

  return (
    <div className="phone-transcript" aria-label={t("phoneView")}>
      <div className="transcript-title-row">
        <p className="transcript-kicker">{t("phoneView")}</p>
        <p>{getLanguage(locale).label} / {journey.completed}/4</p>
      </div>
      <pre>{toPhoneSafe(transcript, locale, asciiSafe)}</pre>
      {selected ? <div className="phone-result"><pre>{toPhoneSafe(result, locale, asciiSafe)}</pre></div> : null}
      <p className="transcript-safety">{t("noDirectory")}</p>
    </div>
  );
}

function LanguagePanel({ locale, asciiSafe, t, onChoose, onToggleAscii, onBack }) {
  const language = getLanguage(locale);
  return (
    <div className="language-panel" aria-live="polite">
      <p className="step-code">{t("resultLanguage")}</p>
      <h2>{t("languageTitle")}</h2>
      <p className="language-intro">{t("languageIntro")}</p>
      <div className="language-list">
        {LANGUAGES.map((item) => (
          <button className={locale === item.code ? "language-choice is-active" : "language-choice"} type="button" key={item.code} onClick={() => onChoose(item.code)} aria-pressed={locale === item.code}>
            <span>[{item.number}]</span>
            <strong>{item.label}</strong>
            <small>{locale === item.code ? t("current") : item.code.toUpperCase()}</small>
          </button>
        ))}
      </div>
      <div className="language-ascii">
        <button type="button" onClick={onToggleAscii} disabled={!language.asciiCapable}>
          [T] {t("asciiMode")}: {language.asciiCapable ? (asciiSafe ? t("asciiOn") : t("asciiOff")) : t("asciiUnavailable")}
        </button>
      </div>
      <p className="language-note">{t("languageNote")}</p>
      <button className="panel-back" type="button" onClick={onBack}>[0] {t("back")}</button>
    </div>
  );
}

function SignalPanel({ history, signals, signal, signalIndex, enabled, detailsOpen, muted, signalSaved, packetText, t, onEnable, onDisable, onDetails, onMute, onSave, onNext, onPrevious, onExport, onBack }) {
  return (
    <div className="signal-panel" aria-live="polite">
      <div className="signal-heading">
        <Broadcast aria-hidden="true" />
        <div><p>{t("signalsHeading")}</p><small>{t("signalsSub")}</small></div>
      </div>
      {!history.length ? (
        <div className="signal-empty">
          <h2>{t("saveFirst")}</h2><p>{t("signalHelp")}</p>
          <button type="button" onClick={onBack}>[0] {t("backMenu")}</button>
        </div>
      ) : !enabled ? (
        <div className="signal-consent">
          <p className="signal-context">{t("context")}: {history.length} {history.length === 1 ? t("localStep") : t("localSteps")}</p>
          <h2>{t("receiveSignals")}</h2><p>{t("signalConsent")}</p>
          <div className="signal-actions">
            <button type="button" onClick={onEnable}>[Y] {t("turnOn")}</button>
            <button type="button" onClick={onDisable}>[N] {t("keepOff")}</button>
            <button type="button" onClick={onBack}>[0] {t("back")}</button>
          </div>
        </div>
      ) : muted ? (
        <div className="signal-empty">
          <h2>{t("muted")}</h2><p>{t("mutedHelp")}</p>
          <div className="signal-actions"><button type="button" onClick={onEnable}>[Y] {t("resume")}</button><button type="button" onClick={onBack}>[0] {t("back")}</button></div>
        </div>
      ) : signal ? (
        <div className="signal-card">
          <p className="signal-preview">{t("synthetic")}</p>
          <div className="signal-rank-row">
            <p className="signal-priority">{signalIndex + 1} {t("of")} {signals.length} / {signal.priority}</p>
            <p className="signal-score">{t("contextScore")} {signal.score}</p>
          </div>
          <h2>{signal.title}</h2>
          <p className="signal-next"><strong>{t("oneStep")}</strong><br />{signal.action}</p>
          {detailsOpen ? (
            <div className="signal-why">
              <p><strong>{t("why")}</strong><br />{signal.reason} {signal.importance}</p>
              <p><strong>{t("aiUsed")}</strong><br />{t("aiUsedText")}</p>
              <p><strong>{t("aiDidNot")}</strong><br />{t("aiDidNotText")}</p>
            </div>
          ) : null}
          <div className="signal-actions">
            <button type="button" onClick={onDetails}>[1] {detailsOpen ? t("less") : t("details")}</button>
            <button type="button" onClick={onNext}>[2] {t("nextSignal")}</button>
            <button type="button" onClick={onPrevious}>[8] {t("previous")}</button>
            <button type="button" onClick={onSave}>[S] {signalSaved ? t("saved") : t("save")}</button>
            <button type="button" onClick={onExport}>[E] {t("resultPacket")}</button>
            <button type="button" onClick={onMute}>[X] {t("mute")}</button>
            <button type="button" onClick={onBack}>[0] {t("back")}</button>
          </div>
          {signalSaved ? <p className="save-receipt">{t("signalSaved")}</p> : null}
          <pre className="signal-phone">{packetText}</pre>
        </div>
      ) : null}
    </div>
  );
}

function GalaxyMap({ activeId, options, t }) {
  return (
    <div className="galaxy-stage" aria-label={t("oneStep")}>
      <img className="galaxy-image" src={`${import.meta.env.BASE_URL}assets/purple-convergence.png`} alt="" width="1207" height="1303" decoding="async" />
      <ol className="galaxy-labels">
        {options.filter((option) => option.id !== 0).map((option) => (
          <li className={activeId === option.id ? "is-active" : ""} key={option.id}>
            <Circle aria-hidden="true" weight="fill" /><span>{option.label}<small>[ {option.id} ]</small></span>
          </li>
        ))}
      </ol>
      <p className="galaxy-promise">{t("oneStep")}</p>
    </div>
  );
}

function NextStep({ option, focus, infoOpen, savedReceipt, notice, t, onFocus, onInfo, onSave, onDone, onExport, onSignals, onHistory, onBack }) {
  const completed = Boolean(savedReceipt?.completedAt);
  return (
    <div className="next-step" aria-live="polite">
      <p className="step-code">{t("path")} [{option.id}] - {option.label}</p>
      <h2>{option.step}</h2>
      <div className="focus-list" aria-label={`${t("chooseFocus")} ${option.label}`}>
        {option.choices.map((choice) => (
          <button className={focus?.id === choice.id ? "focus-choice is-active" : "focus-choice"} key={choice.id} type="button" onClick={() => onFocus(choice.id)} aria-pressed={focus?.id === choice.id}>
            <span>[{choice.id}]</span>{choice.label}
          </button>
        ))}
      </div>
      {focus ? <div className="focused-action"><p>{t("oneStep")}</p><h3>{focus.action}</h3></div> : <p className="focus-hint">{t("pressFocus", { count: option.choices.length })}</p>}

      {completed ? (
        <div className="completion-panel">
          <CheckCircle weight="fill" aria-hidden="true" />
          <div><p>{t("checkpointComplete")}</p><h3>{t("completionMessage")}</h3></div>
        </div>
      ) : null}

      <div className="step-actions">
        <button type="button" onClick={onSave} className={focus ? "primary-action" : ""}>
          {savedReceipt ? <CheckCircle weight="fill" /> : <FloppyDisk />}<span>{savedReceipt ? t("savedReceipt", { id: savedReceipt.id }) : t("saveFocused")}</span>
        </button>
        {savedReceipt && !completed ? <button type="button" onClick={onDone} className="complete-action"><CheckCircle /><span>{t("markDone")}</span></button> : null}
        <button type="button" onClick={onExport}><span>{t("exportPacket")}</span></button>
        <button type="button" onClick={onInfo} aria-expanded={infoOpen}><Info /><span>[I] {infoOpen ? t("lessInfo") : t("moreInfo")}</span></button>
        {completed ? <button type="button" onClick={onSignals}><span>[A] {t("footerSignals")}</span></button> : null}
        {completed ? <button type="button" onClick={onHistory}><span>[H] {t("footerHistory")}</span></button> : null}
        <button type="button" onClick={onBack}><ArrowCounterClockwise /><span>[0] {completed ? t("startAnother") : t("back")}</span></button>
      </div>
      {notice ? <p className={notice.type === "error" ? "save-error" : "save-receipt"}>{notice.text}</p> : null}
      {infoOpen ? (
        <div className="step-info">
          <p><strong>{t("who")}</strong><br />{option.people}</p>
          <p><strong>{t("how")}</strong><br />{option.detail}</p>
          <p><strong>{t("globalRoots")}</strong><br />{t("globalRootsText")}</p>
        </div>
      ) : <p className="step-hint">{t("loopHint")}</p>}
    </div>
  );
}

function HistoryPanel({ history, options, selectedReceiptId, confirmClear, t, onSelect, onResume, onMove, onAskClear, onConfirmClear, onCancelClear, onBack }) {
  const board = getJourneyBoard(history);
  const selectedReceipt = board.items.find((item) => item.id === selectedReceiptId) ?? board.items[0] ?? null;
  return (
    <div className="history-panel" aria-live="polite">
      <p className="step-code">H / RESUMABLE JOURNEY BOARD</p>
      <h2>{history.length ? "NOW / NEXT / LATER / DONE" : t("historyEmpty")}</h2>
      <p className="history-intro">Choose a number, then press R to resume or N, T, L, or D to move it. Receipts stay on this device.</p>
      <div className="journey-board-summary"><span>NOW {board.now.length}</span><span>NEXT {board.next.length}</span><span>LATER {board.later.length}</span><span>DONE {board.done.length}</span></div>
      {board.items.map((receipt, index) => {
        const option = options.find((item) => item.id === receipt.option);
        const choice = ["learning", "walkthrough"].includes(receipt.type) ? null : option?.choices.find((item) => item.id === receipt.choice);
        return (
          <button className={receipt.id === selectedReceipt?.id ? "history-item is-selected" : "history-item"} type="button" key={receipt.id} onClick={() => onSelect(receipt)}>
            <span>[{index + 1}] {receipt.option}.{receipt.choice} / {choice?.label ?? receipt.choiceLabel}</span>
            <small>{choice?.action ?? receipt.step}</small>
            <small className={receipt.lane === "done" ? "receipt-done" : ""}>{receipt.lane.toUpperCase()} / {receipt.id}</small>
          </button>
        );
      })}
      {history.length > board.items.length ? <p className="history-more">{t("olderReceipts", { count: history.length - board.items.length })}</p> : null}
      {confirmClear ? (
        <div className="clear-confirm"><p>{t("removeAll")}</p><button type="button" onClick={onConfirmClear}>[Y] {t("remove")}</button><button type="button" onClick={onCancelClear}>[N] {t("keep")}</button></div>
      ) : (
        <><div className="lane-actions">{selectedReceipt ? <><button type="button" onClick={() => onResume(selectedReceipt)}>[R] RESUME</button><button type="button" onClick={() => onMove(selectedReceipt.id, "now")}>[N] NOW</button><button type="button" onClick={() => onMove(selectedReceipt.id, "next")}>[T] NEXT</button><button type="button" onClick={() => onMove(selectedReceipt.id, "later")}>[L] LATER</button><button type="button" onClick={() => onMove(selectedReceipt.id, "done")}>[D] DONE</button></> : null}</div><div className="signal-actions">{history.length ? <button type="button" onClick={onAskClear}>[C] {t("clearData")}</button> : null}<button type="button" onClick={onBack}>[0] {t("back")}</button></div></>
      )}
    </div>
  );
}

function PacketPanel({ packet, copyStatus, t, onCopy, onDownload, onBack }) {
  return (
    <div className="packet-panel" aria-live="polite">
      <p className="step-code">{t("packetReady")}</p><h2>{packet.title}</h2><p className="packet-intro">{t("packetIntro")}</p>
      <pre>{packet.text}</pre>
      <div className="signal-actions"><button type="button" onClick={onCopy}>[C] {t("copy")}</button><button type="button" onClick={onDownload}>[D] {t("download")}</button><button type="button" onClick={onBack}>[0] {t("back")}</button></div>
      {copyStatus ? <p className={copyStatus.type === "error" ? "save-error" : "save-receipt"}>{copyStatus.text}</p> : null}
    </div>
  );
}

function NeutralExit({ onReturn }) {
  return (
    <main className="neutral-exit" aria-labelledby="weather-notes-heading">
      <p className="wordmark">WEATHER NOTES</p>
      <h1 id="weather-notes-heading">Simple weather preparation</h1>
      <ol><li>Check an official local forecast when available.</li><li>Keep drinking water and a charged light ready.</li><li>Choose a time to check conditions again.</li></ol>
      <p>No location was requested or shared.</p>
      <button type="button" onClick={onReturn}>[0] CLOSE NOTES</button>
    </main>
  );
}

export function ClassicApp({ initialView = null, onTerminal = null, adsDisabled = false, forcedLocale = null, onLocalCleared = null }) {
  const [activeId, setActiveId] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [locale, setLocale] = useState("en");
  const [asciiSafe, setAsciiSafe] = useState(true);
  const [languageOpen, setLanguageOpen] = useState(initialView === "language");
  const [textView, setTextView] = useState(false);
  const [compact, setCompact] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [savedReceipt, setSavedReceipt] = useState(null);
  const [notice, setNotice] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(initialView === "history");
  const [historySelection, setHistorySelection] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [signalsOpen, setSignalsOpen] = useState(initialView === "signals");
  const [signalsEnabled, setSignalsEnabled] = useState(false);
  const [signalDetails, setSignalDetails] = useState(false);
  const [signalMuted, setSignalMuted] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);
  const [savedSignalIds, setSavedSignalIds] = useState([]);
  const [packet, setPacket] = useState(null);
  const [copyStatus, setCopyStatus] = useState(null);
  const [helpOpen, setHelpOpen] = useState(initialView === "help");
  const [neutralExit, setNeutralExit] = useState(false);
  const helpRef = useRef(null);

  const t = (key, variables) => translate(locale, key, variables);
  const language = getLanguage(locale);
  const options = useMemo(() => getLocalizedOptions(locale), [locale]);
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const focus = selected?.choices.find((choice) => choice.id === focusId) ?? null;
  const baseSignals = useMemo(() => rankSignals(history), [history]);
  const signals = useMemo(() => baseSignals.map((item) => localizeSignal(item, locale, options)), [baseSignals, locale, options]);
  const boundedSignalIndex = signals.length ? signalIndex % signals.length : 0;
  const signal = signals[boundedSignalIndex] ?? null;
  const summary = useMemo(() => getJourneySummary(history), [history]);
  const journey = getJourneyState({ selectedId, focusId, receipt: savedReceipt });
  const packetLabels = getPacketLabels(locale);
  const signalPacket = signal ? toPhoneSafe(createSignalPacket(signal, boundedSignalIndex, signals.length, packetLabels), locale, asciiSafe) : "";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const syncLayout = () => setCompact(media.matches);
    syncLayout();
    media.addEventListener("change", syncLayout);
    if (navigator.connection?.saveData) setTextView(true);
    try {
      const loadedHistory = loadHistory(window.localStorage);
      setHistory(loadedHistory);
      if (initialView === "history") setHistorySelection(getJourneyBoard(loadedHistory).items[0]?.id ?? null);
      setSignalsEnabled(window.localStorage.getItem(STORAGE_KEYS.signalConsent) === "on");
      setSignalMuted(window.localStorage.getItem(STORAGE_KEYS.signalMuted) === "on");
      const savedLanguage = window.localStorage.getItem(STORAGE_KEYS.language);
      const browserLanguage = navigator.language?.slice(0, 2).toLowerCase();
      const detected = forcedLocale || (LANGUAGES.some((item) => item.code === savedLanguage) ? savedLanguage : LANGUAGES.some((item) => item.code === browserLanguage) ? browserLanguage : "en");
      setLocale(detected);
      setAsciiSafe(window.localStorage.getItem(STORAGE_KEYS.asciiPhone) !== "off" && getLanguage(detected).asciiCapable);
      const savedSignals = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.savedSignals));
      if (Array.isArray(savedSignals)) setSavedSignalIds(savedSignals.map((item) => item.id));
    } catch {
      setNotice({ type: "error", text: t("storageError") });
    }
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = language.dir;
  }, [language.dir, locale]);

  const closeOverlays = () => {
    setHistoryOpen(false); setSignalsOpen(false); setLanguageOpen(false); setHelpOpen(false); setPacket(null); setConfirmClear(false); setCopyStatus(null);
  };

  const choose = (id) => {
    closeOverlays(); setActiveId(id); setSelectedId(id); setFocusId(null); setInfoOpen(false); setSavedReceipt(null); setNotice(null);
  };
  const chooseFocus = (id) => { setFocusId(id); setSavedReceipt(null); setNotice(null); };
  const goBack = () => { setSelectedId(null); setFocusId(null); setInfoOpen(false); setSavedReceipt(null); setNotice(null); };

  const saveSelected = () => {
    if (!selected || !focus) { setNotice({ type: "error", text: t("chooseBeforeSave") }); return; }
    try {
      const receipt = createPathReceipt(selected, focus, new Date(), locale);
      const nextHistory = savePathReceipt(window.localStorage, receipt);
      const saved = nextHistory.find((item) => item.id === receipt.id) ?? receipt;
      setHistory(nextHistory); setSavedReceipt(saved); setNotice({ type: "success", text: t("savedLocal", { id: receipt.id }) });
    } catch { setNotice({ type: "error", text: t("saveBlocked") }); }
  };

  const markDone = () => {
    if (!savedReceipt) { setNotice({ type: "error", text: t("chooseBeforeSave") }); return; }
    try {
      const result = completePathReceipt(window.localStorage, savedReceipt.id);
      setHistory(result.history); setSavedReceipt(result.receipt);
    } catch { setNotice({ type: "error", text: t("saveBlocked") }); }
  };

  const localizedReceipt = () => savedReceipt ? { ...savedReceipt, label: selected?.label ?? savedReceipt.label, choiceLabel: focus?.label ?? savedReceipt.choiceLabel, step: focus?.action ?? savedReceipt.step, locale } : null;

  const openStepPacket = () => {
    if (!selected || !focus) { setNotice({ type: "error", text: t("chooseBeforePacket") }); return; }
    const receipt = localizedReceipt() ?? createPathReceipt(selected, focus, new Date(), locale);
    const text = toPhoneSafe(createStepPacket(receipt, packetLabels), locale, asciiSafe);
    setPacket({ title: `${selected.id}.${focus.id} / ${focus.label}`, text, filename: `faithai-step-${selected.id}-${focus.id}-${locale}.txt` }); setCopyStatus(null);
  };
  const openSignalPacket = () => {
    if (!signal) return;
    setPacket({ title: signal.title, text: signalPacket, filename: `faithai-signal-${signal.id}-${locale}.txt` }); setCopyStatus(null);
  };
  const copyPacket = async () => {
    if (!packet) return;
    try { await navigator.clipboard.writeText(packet.text); setCopyStatus({ type: "success", text: t("copied") }); }
    catch { setCopyStatus({ type: "error", text: t("copyUnavailable") }); }
  };
  const downloadPacket = () => {
    if (!packet) return;
    const url = URL.createObjectURL(new Blob([`${packet.text}\n`], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = packet.filename; link.click(); URL.revokeObjectURL(url);
    setCopyStatus({ type: "success", text: t("downloaded") });
  };

  const revealResultOnPhone = () => {
    if (compact) requestAnimationFrame(() => document.querySelector(".result-panel")?.scrollIntoView({ block: "start" }));
  };
  const openSignals = () => { setHistoryOpen(false); setLanguageOpen(false); setHelpOpen(false); setPacket(null); setSignalsOpen(true); setSignalDetails(false); setSignalIndex(0); revealResultOnPhone(); };
  const enableSignals = () => { setSignalsEnabled(true); setSignalMuted(false); try { window.localStorage.setItem(STORAGE_KEYS.signalConsent, "on"); window.localStorage.removeItem(STORAGE_KEYS.signalMuted); } catch { /* Session-only consent. */ } };
  const disableSignals = () => { setSignalsEnabled(false); setSignalMuted(false); try { window.localStorage.removeItem(STORAGE_KEYS.signalConsent); window.localStorage.removeItem(STORAGE_KEYS.signalMuted); } catch { /* Session-only choice. */ } };
  const muteSignals = () => { setSignalMuted(true); try { window.localStorage.setItem(STORAGE_KEYS.signalMuted, "on"); } catch { /* Session-only mute. */ } };
  const saveSignal = () => { if (!signal) return; try { setSavedSignalIds(saveSignalReceipt(window.localStorage, signal).map((item) => item.id)); } catch { /* Signal remains visible. */ } };
  const openHistory = () => { const board = getJourneyBoard(history); setSignalsOpen(false); setLanguageOpen(false); setHelpOpen(false); setPacket(null); setHistoryOpen(true); setHistorySelection(board.items[0]?.id ?? null); setConfirmClear(false); revealResultOnPhone(); };
  const openLanguage = () => { setSignalsOpen(false); setHistoryOpen(false); setHelpOpen(false); setPacket(null); setLanguageOpen(true); revealResultOnPhone(); };
  const openHelp = () => { setSignalsOpen(false); setHistoryOpen(false); setLanguageOpen(false); setPacket(null); setHelpOpen(true); revealResultOnPhone(); };

  const selectLanguage = (code) => {
    if (forcedLocale) { setLanguageOpen(false); setNotice({ type: "info", text: "BiNet USA is in English in this first release. General FAITHAI has the bundled language packs." }); return; }
    const nextLanguage = getLanguage(code);
    setLocale(nextLanguage.code); setLanguageOpen(false); setNotice(null);
    if (!nextLanguage.asciiCapable) setAsciiSafe(false);
    try { window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage.code); if (!nextLanguage.asciiCapable) window.localStorage.setItem(STORAGE_KEYS.asciiPhone, "off"); } catch { /* Session-only language. */ }
  };
  const toggleAscii = () => {
    if (!language.asciiCapable) return;
    setAsciiSafe((current) => { const next = !current; try { window.localStorage.setItem(STORAGE_KEYS.asciiPhone, next ? "on" : "off"); } catch { /* Session-only choice. */ } return next; });
  };

  const resumeReceipt = (receipt) => {
    if (["learning", "walkthrough"].includes(receipt.type)) {
      setPacket({ title: receipt.choiceLabel || receipt.label, text: `${receipt.label}\n${receipt.choiceLabel}\n\n${receipt.step}\n\nSaved on this device: ${receipt.savedAt}`, filename: `faithai-${receipt.id}.txt` });
      setCopyStatus(null);
      return;
    }
    const option = options.find((item) => item.id === receipt.option);
    const choice = option?.choices.find((item) => item.id === receipt.choice);
    setActiveId(receipt.option); setSelectedId(receipt.option); setFocusId(receipt.choice);
    setSavedReceipt({ ...receipt, label: option?.label ?? receipt.label, choiceLabel: choice?.label ?? receipt.choiceLabel, step: choice?.action ?? receipt.step });
    setHistoryOpen(false); setConfirmClear(false); setNotice({ type: "success", text: t("reopened", { id: receipt.id }) });
  };
  const moveReceipt = (receiptId, lane) => {
    try {
      const result = movePathReceipt(window.localStorage, receiptId, lane);
      setHistory(result.history); setHistorySelection(result.receipt?.id ?? null);
      if (savedReceipt?.id === receiptId) setSavedReceipt(result.receipt);
    } catch { setNotice({ type: "error", text: t("saveBlocked") }); }
  };
  const clearLocalData = () => {
    try { clearFaithaiLocalData(window.localStorage); } catch { /* State still clears. */ }
    onLocalCleared?.();
    setHistory([]); setSavedReceipt(null); setSavedSignalIds([]); setSignalsEnabled(false); setSignalMuted(false); setConfirmClear(false); setHistorySelection(null); setNotice(null); setLocale("en"); setAsciiSafe(true);
  };
  const quickExit = () => {
    setHelpOpen(false); setHistoryOpen(false); setSignalsOpen(false); setLanguageOpen(false); setPacket(null);
    setSelectedId(null); setFocusId(null); setActiveId(0); setNotice(null);
    setNeutralExit(true); document.title = "Weather notes";
  };
  const clearSharedDevice = () => { clearLocalData(); setHelpOpen(false); setSelectedId(null); setFocusId(null); setActiveId(0); setNeutralExit(true); document.title = "Weather notes"; };
  const returnFromNeutral = () => { setNeutralExit(false); document.title = "FAITHAI — One Useful Next Step"; };

  const handleCommand = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
    const key = event.key.toLowerCase();
    let handled = true;
    if (neutralExit) {
      if (key === "0") returnFromNeutral(); else handled = false;
    } else if (packet) {
      if (key === "0") setPacket(null); else if (key === "c") copyPacket(); else if (key === "d") downloadPacket(); else handled = false;
    } else if (languageOpen) {
      if (key === "0" || key === "l") setLanguageOpen(false);
      else if (key === "t") toggleAscii();
      else if (/^[1-5]$/.test(key)) selectLanguage(LANGUAGES[Number(key) - 1].code);
      else handled = false;
    } else if (historyOpen) {
      if (key === "0" || key === "h") setHistoryOpen(false);
      else if (key === "c" && history.length) setConfirmClear(true);
      else if (confirmClear && key === "y") clearLocalData();
      else if (confirmClear && key === "n") setConfirmClear(false);
      else if (!confirmClear && /^[1-9]$/.test(key) && getJourneyBoard(history).items[Number(key) - 1]) setHistorySelection(getJourneyBoard(history).items[Number(key) - 1].id);
      else if (!confirmClear && key === "r" && historySelection) { const receipt = history.find((item) => item.id === historySelection); if (receipt) resumeReceipt(receipt); }
      else if (!confirmClear && ["n", "t", "l", "d"].includes(key) && historySelection) moveReceipt(historySelection, { n: "now", t: "next", l: "later", d: "done" }[key]);
      else handled = false;
    } else if (helpOpen) {
      if (key === "m") setHelpOpen(false);
      else {
        const helpHandled = Boolean(helpRef.current?.handleCommand(key));
        if (key === "0" && !helpHandled) setHelpOpen(false);
        else handled = helpHandled;
      }
    } else if (signalsOpen) {
      if (key === "0" || key === "a") setSignalsOpen(false);
      else if (key === "y") enableSignals(); else if (key === "n") disableSignals();
      else if (key === "x" && signalsEnabled) muteSignals();
      else if (key === "1" && signalsEnabled && !signalMuted) setSignalDetails((current) => !current);
      else if (key === "2" && signals.length > 1) setSignalIndex((current) => (current + 1) % signals.length);
      else if (key === "8" && signals.length > 1) setSignalIndex((current) => (current - 1 + signals.length) % signals.length);
      else if (key === "s" && signalsEnabled && signal) saveSignal(); else if (key === "e" && signalsEnabled && signal) openSignalPacket();
      else handled = false;
    } else if (key === "t" && onTerminal) onTerminal();
    else if (key === "l") openLanguage();
    else if (key === "a") openSignals();
    else if (key === "h") openHistory();
    else if (key === "m") openHelp();
    else if (key === "p") setTextView((current) => !current);
    else if (selected) {
      if (key === "0") goBack();
      else if (/^[1-9]$/.test(key) && selected.choices[Number(key) - 1]) chooseFocus(Number(key));
      else if (key === "i") setInfoOpen((current) => !current);
      else if (key === "s") saveSelected(); else if (key === "d") markDone(); else if (key === "e") openStepPacket();
      else handled = false;
    } else if (/^[0-5]$/.test(key)) choose(Number(key));
    else handled = false;
    if (handled) event.preventDefault();
  };
  useGlobalCommandMap(handleCommand);

  const resultHeading = packet ? t("resultPacket") : helpOpen ? t("footerHelp") : languageOpen ? t("resultLanguage") : historyOpen ? "JOURNEY BOARD" : signalsOpen ? t("resultSignals") : t("resultStep");
  const showJourney = Boolean(selected && !packet && !helpOpen && !languageOpen && !historyOpen && !signalsOpen);

  if (neutralExit) return <NeutralExit onReturn={returnFromNeutral} />;

  return (
    <main className="app-shell" dir={language.dir} lang={locale}>
      <div className="main-grid">
        <div className="left-column">
          <header className="brand-header"><p className="wordmark">FAITHAI</p><span className="brand-divider" aria-hidden="true" /><p className="institute">{t("brandInstitute")}</p></header>
          <div className="header-rule" aria-hidden="true"><span>+</span></div>
          <section className="menu-panel" aria-labelledby="menu-heading">
            <div className="menu-intro"><h1 id="menu-heading">{t("ask")}</h1><p>{t("chooseLater")}</p></div>
            <div className="choice-list">
              {options.map((option) => (
                <button className={activeId === option.id ? "choice is-active" : "choice"} key={option.id} type="button" onClick={() => choose(option.id)} onFocus={() => setActiveId(option.id)} aria-pressed={selectedId === option.id}>
                  <span className="choice-arrow" aria-hidden="true">{activeId === option.id ? <CaretRight weight="fill" /> : null}</span><span className="choice-number">[ {option.id} ]</span><span className="choice-label">{option.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="result-panel" aria-labelledby="result-heading">
          <div className="result-title-row"><h2 id="result-heading">{resultHeading}</h2><button className="view-toggle" type="button" onClick={() => setTextView((current) => !current)} aria-pressed={textView}>[P] {textView ? t("visual") : t("text")}</button></div>
          {showJourney ? <JourneyRail state={journey} t={t} /> : null}
          {packet ? <PacketPanel packet={packet} copyStatus={copyStatus} t={t} onCopy={copyPacket} onDownload={downloadPacket} onBack={() => setPacket(null)} />
            : helpOpen ? <HelpHubPanel ref={helpRef} adsDisabled={adsDisabled} locale={locale} asciiSafe={asciiSafe} onPacket={(nextPacket) => { setPacket(nextPacket); setCopyStatus(null); }} onQuickExit={quickExit} onClearLocal={clearSharedDevice} />
            : languageOpen ? <LanguagePanel locale={locale} asciiSafe={asciiSafe} t={t} onChoose={selectLanguage} onToggleAscii={toggleAscii} onBack={() => setLanguageOpen(false)} />
            : historyOpen ? <HistoryPanel history={history} options={options} selectedReceiptId={historySelection} confirmClear={confirmClear} t={t} onSelect={(receipt) => setHistorySelection(receipt.id)} onResume={resumeReceipt} onMove={moveReceipt} onAskClear={() => setConfirmClear(true)} onConfirmClear={clearLocalData} onCancelClear={() => setConfirmClear(false)} onBack={() => setHistoryOpen(false)} />
            : signalsOpen ? <SignalPanel history={history} signals={signals} signal={signal} signalIndex={boundedSignalIndex} enabled={signalsEnabled} detailsOpen={signalDetails} muted={signalMuted} signalSaved={Boolean(signal && savedSignalIds.includes(signal.id))} packetText={signalPacket} t={t} onEnable={enableSignals} onDisable={disableSignals} onDetails={() => setSignalDetails((current) => !current)} onMute={muteSignals} onSave={saveSignal} onNext={() => setSignalIndex((current) => signals.length ? (current + 1) % signals.length : 0)} onPrevious={() => setSignalIndex((current) => signals.length ? (current - 1 + signals.length) % signals.length : 0)} onExport={openSignalPacket} onBack={() => setSignalsOpen(false)} />
            : textView || compact ? <PhoneTranscript options={options} selected={selected} focus={focus} infoOpen={infoOpen} savedReceipt={savedReceipt} locale={locale} asciiSafe={asciiSafe} t={t} />
            : selected ? <NextStep option={selected} focus={focus} infoOpen={infoOpen} savedReceipt={savedReceipt} notice={notice} t={t} onFocus={chooseFocus} onInfo={() => setInfoOpen((current) => !current)} onSave={saveSelected} onDone={markDone} onExport={openStepPacket} onSignals={openSignals} onHistory={openHistory} onBack={goBack} />
            : <GalaxyMap activeId={activeId} options={options} t={t} />}
        </section>
      </div>

      <footer className="safety-footer">
        {onTerminal ? <><button type="button" onClick={onTerminal}><span>[T] TERMINAL</span></button><span className="footer-divider" aria-hidden="true" /></> : null}
        <button type="button" onClick={() => setTextView(true)}><DeviceMobile aria-hidden="true" /><span>{t("footerPhone")}</span></button>
        <span className="footer-divider" aria-hidden="true" />
        <button type="button" onClick={openLanguage}><span>[L] {language.label}</span></button>
        <span className="footer-divider" aria-hidden="true" />
        <button type="button" onClick={openSignals}><BellRinging aria-hidden="true" /><span>[A] {t("footerSignals")} {signals.length ? `(${signals.length})` : ""}</span></button>
        <span className="footer-divider" aria-hidden="true" />
        <button type="button" onClick={openHelp}><span>[M] {t("footerHelp")}</span></button>
        <span className="footer-divider" aria-hidden="true" />
        <button type="button" onClick={openHistory}><FloppyDisk aria-hidden="true" /><span>[H] {t("progressSaved", { saved: summary.saved })} / {t("progressDone", { done: summary.done })}</span></button>
        <span className="footer-divider" aria-hidden="true" />
        <p><LockKey aria-hidden="true" /><span>{t("footerScope")}</span></p>
      </footer>
    </main>
  );
}
