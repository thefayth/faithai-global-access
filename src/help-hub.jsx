import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { createAdContext, getAdEligibility, hasConfiguredAdProvider, loadConfiguredAd } from "./ad-provider.js";
import { CHALLENGES, DEMO_CIRCLE, aggregateChallengeProgress, joinPrototypeCircle, recordChallengeProgress } from "./challenge-engine.js";
import { SimulatorChannelProvider, createLowTechScreen } from "./channel-provider.js";
import { LOCALE_REGISTRY, createPackText, getHelpChrome, getHelpMenu, getPacks, isPackFresh } from "./help-content.js";
import { createRecoveryBundle, openRecoveryBundle } from "./recovery.js";
import { apiUrl } from "./api-url.js";

const HELP_STATE_KEY = "faithai.help-state.v1";
const AGE_CLASS_KEY = "faithai.age-class.v1";
const AD_CONSENT_KEY = "faithai.contextual-ad-consent.v1";
const DEVICE_ONLY_KEYS = new Set([AGE_CLASS_KEY, AD_CONSENT_KEY]);

function readHelpState() {
  try {
    const value = JSON.parse(localStorage.getItem(HELP_STATE_KEY));
    return value && typeof value === "object" ? value : { progress: {}, helpActivity: [] };
  } catch { return { progress: {}, helpActivity: [] }; }
}

function saveHelpState(value) {
  try { localStorage.setItem(HELP_STATE_KEY, JSON.stringify(value)); } catch { /* Local-only session still works. */ }
}

function PackReceipt({ pack, chrome, onExport, onPrint, onLowTech }) {
  return (
    <article className="help-receipt">
      <p className="help-status">{pack.status.toUpperCase()} / {pack.locale} / {pack.territory}</p>
      <h3>{pack.title}</h3>
      <p>{pack.summary}</p>
      {pack.sections.map((section, index) => <section key={section.title}><h4>{index + 1}. {section.title}</h4><p>{section.text}</p></section>)}
      <dl className="receipt-grid">
        <div><dt>VERSION</dt><dd>{pack.version}</dd></div><div><dt>FRESH UNTIL</dt><dd>{pack.expiration}</dd></div>
        <div><dt>LICENSE</dt><dd>{pack.license}</dd></div><div><dt>REVIEW</dt><dd>{pack.reviewers.join("; ")}</dd></div>
      </dl>
      <p className="source-line">SOURCE / <a href={pack.sources[0].url} target="_blank" rel="noreferrer">{pack.sources[0].title}</a></p>
      <div className="signal-actions"><button type="button" onClick={onExport}>[E] {chrome.saveText}</button><button type="button" onClick={onPrint}>[P] {chrome.print}</button><button type="button" onClick={onLowTech}>[U] {chrome.phoneView}</button></div>
    </article>
  );
}

function hasRenderedAd(host) {
  return Boolean(host?.querySelector?.("iframe, a[href], img, video") || host?.dataset?.adProvider === "sponsor" && host.textContent?.trim());
}

function ContextualAdSpace({ surface, locale, ageClass, consent, providerEnabled }) {
  const host = useRef(null);
  const context = useMemo(() => createAdContext({ surface, locale, territory: "global", ageClass }), [ageClass, locale, surface]);
  const eligibility = getAdEligibility(context);
  const [status, setStatus] = useState("pending");
  const [activeProvider, setActiveProvider] = useState("");
  useEffect(() => {
    let current = true;
    let observer = null;
    let timer = null;
    setStatus("pending");
    setActiveProvider("");
    loadConfiguredAd(context, host.current, { consent, providerEnabled, placement: `${surface}-text` }).then((result) => {
      if (!current) return;
      if (!result.loaded) { setStatus("empty"); return; }
      setActiveProvider(result.provider || "");
      if (hasRenderedAd(host.current)) { setStatus("ready"); return; }
      const reveal = () => { if (current && hasRenderedAd(host.current)) { setStatus("ready"); observer?.disconnect(); clearTimeout(timer); } };
      if (typeof MutationObserver !== "undefined" && host.current) {
        observer = new MutationObserver(reveal);
        observer.observe(host.current, { childList: true, subtree: true, characterData: true });
      }
      timer = setTimeout(() => { if (current) setStatus(hasRenderedAd(host.current) ? "ready" : "empty"); observer?.disconnect(); }, 5000);
    });
    return () => { current = false; observer?.disconnect(); clearTimeout(timer); };
  }, [consent, context, providerEnabled, surface]);
  if (!eligibility.eligible || !consent || !providerEnabled || !hasConfiguredAdProvider()) return null;
  return <aside className={`ad-space is-${status}`} data-provider={activeProvider || undefined} aria-label="Advertisement" aria-hidden={status !== "ready"}><span>ADVERTISEMENT / CONTEXTUAL ONLY</span><div ref={host} /></aside>;
}

function RecoveryTools({ onRestore }) {
  const [status, setStatus] = useState("");
  const [code, setCode] = useState("");
  const [bundle, setBundle] = useState("");

  const create = async () => {
    const local = {};
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith("faithai.") && !DEVICE_ONLY_KEYS.has(key)) local[key] = localStorage.getItem(key);
    }
    const result = await createRecoveryBundle(local);
    setCode(result.code); setBundle(result.bundle); setStatus("Recovery file ready. Keep the file and code separate.");
  };
  const download = () => {
    if (!bundle) return;
    const url = URL.createObjectURL(new Blob([bundle], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "faithai-private-recovery.json"; link.click(); URL.revokeObjectURL(url);
  };
  const restore = async () => {
    try { const restored = await openRecoveryBundle(bundle, code); onRestore(restored); setStatus("Recovery opened on this device."); }
    catch { setStatus("Recovery could not be opened. Check the file text and code."); }
  };
  return (
    <div className="recovery-tools">
      <h3>ACCOUNT-FREE RECOVERY</h3>
      <p>The encrypted recovery file contains FAITHAI local state. FAITHAI does not receive the code or file.</p>
      <div className="signal-actions"><button type="button" onClick={create}>[1] CREATE</button>{bundle ? <button type="button" onClick={download}>[2] DOWNLOAD FILE</button> : null}</div>
      {code ? <p className="recovery-code" aria-label="Recovery code">CODE / {code.match(/.{1,5}/g)?.join("-")}</p> : null}
      <label className="recovery-field">RECOVERY FILE TEXT<textarea value={bundle} onChange={(event) => setBundle(event.target.value)} /></label>
      <label className="recovery-field">RECOVERY CODE<input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" /></label>
      <button type="button" onClick={restore}>[3] OPEN RECOVERY</button>
      {status ? <p className="save-receipt">{status}</p> : null}
    </div>
  );
}

export const HelpHubPanel = forwardRef(function HelpHubPanel({ locale, asciiSafe, onPacket, onQuickExit, onClearLocal, adsDisabled = false }, ref) {
  const [section, setSection] = useState(null);
  const [packIndex, setPackIndex] = useState(null);
  const [circle, setCircle] = useState(null);
  const [circleCode, setCircleCode] = useState(DEMO_CIRCLE.code);
  const [challengeIndex, setChallengeIndex] = useState(null);
  const [helpState, setHelpState] = useState(() => readHelpState());
  const [channelReceipt, setChannelReceipt] = useState(null);
  const [joinNotice, setJoinNotice] = useState("");
  const [ageClass, setAgeClass] = useState(() => {
    try { return localStorage.getItem(AGE_CLASS_KEY) === "adult-confirmed" ? "adult-confirmed" : "unknown"; }
    catch { return "unknown"; }
  });
  const [adConsent, setAdConsent] = useState(() => {
    try { return localStorage.getItem(AD_CONSENT_KEY) === "allowed"; }
    catch { return false; }
  });
  const [adProviderEnabled, setAdProviderEnabled] = useState(false);
  const [adNotice, setAdNotice] = useState("");
  const helpMenu = useMemo(() => getHelpMenu(locale), [locale]);
  const chrome = useMemo(() => getHelpChrome(locale), [locale]);
  const selectedMenu = helpMenu.find((item) => item.key === section) ?? null;
  const kind = section === "books" ? "book" : section;
  const packs = getPacks(kind, locale);
  const pack = packIndex === null ? null : packs[packIndex] ?? null;
  const challenge = challengeIndex === null ? null : CHALLENGES[challengeIndex] ?? null;

  useEffect(() => {
    if (adsDisabled) { setAdProviderEnabled(false); return undefined; }
    const controller = new AbortController();
    fetch(apiUrl("integrations/status", import.meta.env.VITE_API_BASE), { headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal }).then(async (response) => {
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return null;
      return response.json();
    }).then((status) => {
      if (!status) return;
      const territories = Array.isArray(status.liveTerritories) ? status.liveTerritories : [];
      const territoryReady = territories.includes("global");
      setAdProviderEnabled(Boolean(territoryReady && (status.providers?.exoclick || status.providers?.adsense)));
    }).catch(() => { /* Static/offline builds keep third-party ads disabled. */ });
    return () => controller.abort();
  }, [adsDisabled]);

  const returnToMenu = () => { setSection(null); setPackIndex(null); setChallengeIndex(null); setChannelReceipt(null); setJoinNotice(""); };
  const openSection = (id) => { const item = helpMenu.find((entry) => entry.id === id); if (item) { setSection(item.key); setPackIndex(null); setChallengeIndex(null); setChannelReceipt(null); } };
  const exportPack = () => { if (pack) onPacket({ title: pack.title, text: createPackText(pack), filename: `${pack.id}.txt` }); };
  const showLowTech = async () => {
    const items = pack ? pack.sections.map((item) => `${item.title}: ${item.text}`) : helpMenu.map((item) => item.label);
    const screen = createLowTechScreen(pack?.title || chrome.moreHelp, items);
    setChannelReceipt(await new SimulatorChannelProvider("USSD").send({ screen: screen.text, commands: ["Simulation only. No carrier message was sent."] }));
  };
  const join = async (code = circleCode) => {
    const result = await joinPrototypeCircle(code);
    setCircle(result); setJoinNotice(result ? "Invitation accepted locally. No public profile was created." : "That invitation is unavailable or revoked.");
  };
  const respond = (response) => {
    if (!challenge) return;
    const progress = recordChallengeProgress(helpState.progress, challenge.id, response);
    const next = { ...helpState, progress, helpActivity: [...new Set([...(helpState.helpActivity || []), "challenges"])] };
    setHelpState(next); saveHelpState(next);
  };
  const setAdult = (confirmed) => {
    if (adsDisabled) return;
    const next = confirmed ? "adult-confirmed" : "unknown";
    setAgeClass(next);
    if (!confirmed) setAdConsent(false);
    setAdNotice(confirmed ? "Adult mode confirmed on this device. Contextual ads remain off until you allow them." : "Adult mode and contextual ad consent cleared.");
    try {
      if (confirmed) localStorage.setItem(AGE_CLASS_KEY, next);
      else { localStorage.removeItem(AGE_CLASS_KEY); localStorage.removeItem(AD_CONSENT_KEY); }
    } catch { /* Session-only preference. */ }
  };
  const toggleAdConsent = () => {
    if (adsDisabled) return;
    if (ageClass !== "adult-confirmed") { setAdNotice("Confirm adult mode first. No advertising provider was contacted."); return; }
    const next = !adConsent;
    setAdConsent(next);
    setAdNotice(next ? "Contextual ads allowed on approved general pages. A third-party provider may receive normal browser and network request data." : "Contextual ads off. No new ad requests will be made.");
    try { if (next) localStorage.setItem(AD_CONSENT_KEY, "allowed"); else localStorage.removeItem(AD_CONSENT_KEY); } catch { /* Session-only preference. */ }
  };
  const restore = (entries) => {
    Object.entries(entries).forEach(([key, value]) => { if (key.startsWith("faithai.") && !DEVICE_ONLY_KEYS.has(key) && typeof value === "string") localStorage.setItem(key, value); });
    setHelpState(readHelpState());
  };

  const handleCommand = (key) => {
    if (section === null) {
      if (/^[1-7]$/.test(key)) { openSection(Number(key)); return true; }
      if (key === "u") { showLowTech(); return true; }
      return false;
    }
    if (key === "q" && section === "safety") { onQuickExit(); return true; }
    if (key === "0") {
      if (packIndex !== null || challengeIndex !== null) { setPackIndex(null); setChallengeIndex(null); setChannelReceipt(null); }
      else returnToMenu();
      return true;
    }
    if (section === "challenges") {
      if (!circle && key === "1") { join(DEMO_CIRCLE.code); return true; }
      if (circle && challengeIndex === null && /^[1-3]$/.test(key)) { setChallengeIndex(Number(key) - 1); return true; }
      if (circle && challenge && /^[1-3]$/.test(key)) { respond(["done", "need_help", "later"][Number(key) - 1]); return true; }
    }
    if (packs.length && packIndex === null && /^[1-9]$/.test(key) && packs[Number(key) - 1]) { setPackIndex(Number(key) - 1); return true; }
    if (pack && key === "e") { exportPack(); return true; }
    if (pack && key === "p") { window.print(); return true; }
    if (key === "u") { showLowTech(); return true; }
    if (section === "partners" && key === "y") { setAdult(ageClass !== "adult-confirmed"); return true; }
    if (section === "partners" && key === "a") { toggleAdConsent(); return true; }
    return false;
  };
  useImperativeHandle(ref, () => ({ handleCommand, returnToMenu }), [ageClass, challenge, challengeIndex, circle, pack, packIndex, packs, section]);

  if (section === null) return (
    <div className="help-panel" aria-live="polite">
      <p className="step-code">M / {chrome.moreHelp}</p><h2>{chrome.chooseLane}</h2>
      <p className="history-intro">{chrome.coreFree}</p>
      <div className="help-menu">{helpMenu.map((item) => <button type="button" key={item.key} onClick={() => openSection(item.id)}><span>[{item.id}] {item.label}</span><small>{item.short}</small></button>)}</div>
      <div className="signal-actions"><button type="button" onClick={showLowTech}>[U] {chrome.phoneSimulator}</button><button type="button" onClick={onClearLocal}>[X] {chrome.clearShared}</button></div>
      {channelReceipt ? <pre className="low-tech-screen">{channelReceipt.receipt}{"\n\n"}{channelReceipt.body}</pre> : null}
    </div>
  );

  if (section === "challenges") {
    const response = challenge ? helpState.progress?.[challenge.id]?.response : null;
    const totals = challenge ? aggregateChallengeProgress([helpState.progress], challenge.id) : null;
    return (
      <div className="help-panel challenge-panel" aria-live="polite">
        <p className="step-code">M.1 / PRIVATE CIRCLE</p><h2>COMMUNITY CHALLENGES</h2>
        {!circle ? <><p>Invitation-scoped prototype. No directory, ranking, streak, points, direct messages, or global feed.</p><button type="button" className="primary-action" onClick={() => join(DEMO_CIRCLE.code)}>[1] {chrome.openDemo}</button><label className="recovery-field">OPTIONAL INVITATION CODE<input value={circleCode} onChange={(event) => setCircleCode(event.target.value)} autoComplete="off" /></label><button type="button" onClick={() => join()}>[J] JOIN WITH CODE</button></> : challenge ? <><p className="help-status">{circle.territory} / {challenge.moderationState}</p><h3>{challenge.title}</h3><p>{challenge.action}</p><div className="challenge-responses"><button type="button" onClick={() => respond("done")}>[1] {chrome.done}</button><button type="button" onClick={() => respond("need_help")}>[2] {chrome.needHelp}</button><button type="button" onClick={() => respond("later")}>[3] {chrome.later}</button></div>{response ? <p className="save-receipt">SAVED LOCALLY / {response.replace("_", " ").toUpperCase()}</p> : null}<p className="cooperative-total">COOPERATIVE TOTAL / DONE {totals.done} / NEED HELP {totals.need_help} / LATER {totals.later}</p></> : <><p className="steward-announcement">STEWARD ANNOUNCEMENT / {circle.announcement}</p><div className="help-menu">{CHALLENGES.map((item, index) => <button type="button" key={item.id} onClick={() => setChallengeIndex(index)}><span>[{index + 1}] {item.title.toUpperCase()}</span><small>{item.action}</small></button>)}</div></>}
        {joinNotice ? <p className="save-receipt">{joinNotice}</p> : null}<div className="signal-actions"><button type="button" onClick={() => challenge ? setChallengeIndex(null) : returnToMenu()}>[0] {chrome.back}</button></div>
        {!circle && !adsDisabled ? <ContextualAdSpace surface="challenge-discovery" locale={locale} ageClass={ageClass} consent={adConsent} providerEnabled={adProviderEnabled} /> : null}
      </div>
    );
  }

  if (section === "partners") return (
    <div className="help-panel" aria-live="polite">
      <p className="step-code">M.7 / GOVERNANCE + REVENUE</p><h2>PARTNERS + STEWARDS</h2>
      <div className="partner-grid"><article><h3>LOCAL STEWARD</h3><p>Publish bounded challenges, review sources, expire stale records, revoke codes, and keep moderation receipts. OIDC, MFA, and role permissions are required for a live portal.</p></article><article><h3>PARTNER</h3><p>Sponsor a language pack, open-book collection, governed circle, or regional deployment. Sponsorship never buys user history or safety data.</p></article><article><h3>REVENUE BOUNDARY</h3><p>Earned business revenue, restricted grants/donations, and in-kind Power Credits remain separate. Hosted payments keep card details outside FAITHAI.</p></article></div>
      {adsDisabled ? <p className="history-intro">Third-party advertising is disabled throughout BiNet USA help, including Classic view.</p> : <>
        <button type="button" onClick={() => setAdult(ageClass !== "adult-confirmed")}>[Y] ADULT MODE / {ageClass === "adult-confirmed" ? "CONFIRMED — PRESS TO RESET" : "OFF — PRESS ONLY IF ADULT"}</button>
        <button type="button" onClick={toggleAdConsent}>[A] ALLOW CONTEXTUAL ADS / {adConsent ? "ALLOWED — PRESS TO TURN OFF" : "OFF"}</button>
        <p className="history-intro">Unknown-age and family modes load no third-party ad code. Contextual ads require both adult mode and separate permission. The provider may receive normal browser and network request data, but FAITHAI does not send journey, hardship, identity, safety, aid, circle, or Power Credit history.</p>
      </>}
      {adNotice ? <p className="save-receipt" role="status">{adNotice}</p> : null}
      <RecoveryTools onRestore={restore} />
      <div className="language-wave"><h3>LANGUAGE REVIEW QUEUE</h3><p>{LOCALE_REGISTRY.filter((item) => item.status === "review-queue").map((item) => `${item.label} (${item.locale})`).join(" / ")}</p></div>
      <div className="signal-actions"><button type="button" onClick={returnToMenu}>[0] {chrome.back}</button></div>
    </div>
  );

  if (packs.length) return (
    <div className={`help-panel help-${section}`} aria-live="polite">
      <p className="step-code">M.{selectedMenu.id} / {selectedMenu.label}</p><h2>{selectedMenu.label}</h2>
      {section === "safety" ? <button type="button" className="quick-exit" onClick={onQuickExit}>[Q] {chrome.quickExit}</button> : null}
      {pack ? <PackReceipt pack={pack} chrome={chrome} onExport={exportPack} onPrint={() => window.print()} onLowTech={showLowTech} /> : <><p>{selectedMenu.short} Prototype records are source-linked; governed pilots require human regional review.</p><div className="help-menu">{packs.map((item, index) => <button type="button" key={item.id} disabled={!isPackFresh(item)} onClick={() => setPackIndex(index)}><span>[{index + 1}] {item.title.toUpperCase()}</span><small>{item.summary}</small><small>{item.status.toUpperCase()} / {item.territory} / EXPIRES {item.expiration}</small></button>)}</div></>}
      {channelReceipt ? <pre className="low-tech-screen">{channelReceipt.receipt}{"\n\n"}{channelReceipt.body}</pre> : null}
      <div className="signal-actions"><button type="button" onClick={() => pack ? setPackIndex(null) : returnToMenu()}>[0] {chrome.back}</button></div>
      {!adsDisabled && (section === "books" || section === "agriculture") ? <ContextualAdSpace surface={section} locale={locale} ageClass={ageClass} consent={adConsent} providerEnabled={adProviderEnabled} /> : null}
    </div>
  );

  return <div className="help-panel"><p className="step-code">M.{selectedMenu.id}</p><h2>{selectedMenu.label}</h2><p>This lane has no eligible current local pack. A steward must add a sourced, reviewed, unexpired record.</p><button type="button" onClick={returnToMenu}>[0] {chrome.back}</button></div>;
});
