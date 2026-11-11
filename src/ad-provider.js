const ALLOWED_SURFACES = new Set(["books", "agriculture", "challenge-discovery", "tools"]);
const EXCLUDED_SURFACES = new Set(["safety", "aid", "housing", "health", "signals", "journey", "circle", "power-credits", "youth"]);
const EXOCLICK_SCRIPT_HOSTS = new Set(["a.magsrv.com", "a.pemsrv.com"]);
const DEFAULT_EXOCLICK_CLASS = "eas6a97888e";

export function createAdContext({ surface, locale, territory, ageClass }) {
  return { surface, locale, territory, ageClass };
}

export function getAdEligibility(context) {
  if (!context || context.ageClass !== "adult-confirmed") return { eligible: false, reason: "adult-confirmation-required" };
  if (EXCLUDED_SURFACES.has(context.surface)) return { eligible: false, reason: "excluded-help-surface" };
  if (!ALLOWED_SURFACES.has(context.surface)) return { eligible: false, reason: "surface-not-approved" };
  return { eligible: true, reason: "contextual-only" };
}

export function getAdLoadDecision({ context, consent = false, providerEnabled = false } = {}) {
  const eligibility = getAdEligibility(context);
  if (!eligibility.eligible) return { load: false, ...eligibility };
  if (!consent) return { load: false, eligible: true, reason: "contextual-ad-consent-required" };
  if (!providerEnabled) return { load: false, eligible: true, reason: "provider-disabled" };
  return { load: true, eligible: true, reason: "contextual-only" };
}

function runtimeEnv() {
  try { return import.meta.env || {}; } catch { return {}; }
}

export function getExoClickZoneConfig(env = runtimeEnv()) {
  const scriptUrl = String(env.VITE_EXOCLICK_SCRIPT_URL || "").trim();
  const zoneId = String(env.VITE_EXOCLICK_ZONE_ID || "").trim();
  const zoneClass = String(env.VITE_EXOCLICK_ZONE_CLASS || DEFAULT_EXOCLICK_CLASS).trim();
  let parsed = null;
  try { parsed = new URL(scriptUrl); } catch { /* Invalid configuration remains disabled. */ }
  const validUrl = Boolean(parsed && parsed.protocol === "https:" && EXOCLICK_SCRIPT_HOSTS.has(parsed.hostname));
  const validZone = /^\d+$/.test(zoneId);
  const validClass = /^[A-Za-z0-9_-]+$/.test(zoneClass);
  return { configured: validUrl && validZone && validClass, scriptUrl, zoneId, zoneClass, sfwOnly: true };
}

export function configuredAdProviders(env = runtimeEnv()) {
  const requested = String(env.VITE_AD_PROVIDERS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return requested.filter((provider) => provider === "adsense" ? Boolean(env.VITE_GOOGLE_ADSENSE_CLIENT) : provider === "exoclick" ? getExoClickZoneConfig(env).configured : provider === "sponsor" ? Boolean(env.VITE_SPONSOR_LABEL) : false);
}

export function hasConfiguredAdProvider(env = runtimeEnv()) {
  return configuredAdProviders(env).length > 0;
}

function findScript(documentRef, scriptUrl) {
  return Array.from(documentRef?.scripts || []).find((script) => script.src === scriptUrl || script.getAttribute?.("src") === scriptUrl) || null;
}

function ensureScript(documentRef, scriptUrl, { provider, timeoutMs = 4000 } = {}) {
  if (!documentRef?.head || !scriptUrl) return Promise.resolve({ loaded: false, provider, reason: "adapter-not-configured" });
  const existing = findScript(documentRef, scriptUrl);
  if (existing?.dataset?.faithaiLoaded === "true") return Promise.resolve({ loaded: true, provider, reason: "provider-script-ready" });
  return new Promise((resolve) => {
    const script = existing || documentRef.createElement("script");
    let settled = false;
    const finish = (loaded, reason) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (loaded && script.dataset) script.dataset.faithaiLoaded = "true";
      resolve({ loaded, provider, reason });
    };
    const timer = setTimeout(() => finish(false, "provider-script-timeout"), Math.max(1, timeoutMs));
    script.addEventListener?.("load", () => finish(true, "provider-script-ready"), { once: true });
    script.addEventListener?.("error", () => finish(false, "provider-script-failed"), { once: true });
    if (!existing) {
      script.async = true;
      script.type = "application/javascript";
      script.crossOrigin = "anonymous";
      script.dataset.faithaiAdProvider = provider;
      script.src = scriptUrl;
      documentRef.head.appendChild(script);
    }
  });
}

export class AdSenseProvider {
  constructor(env = runtimeEnv()) { this.env = env; this.name = "adsense"; }
  async load({ context, consent, host, documentRef = typeof document === "undefined" ? null : document }) {
    if (!consent || !host) return { loaded: false, provider: this.name, reason: "contextual-ad-consent-required" };
    const client = String(this.env.VITE_GOOGLE_ADSENSE_CLIENT || "").trim();
    if (!client) return { loaded: false, provider: this.name, reason: "adapter-not-configured" };
    host.dataset.adProvider = this.name;
    host.dataset.adContext = JSON.stringify(context);
    return ensureScript(documentRef, `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`, { provider: this.name, timeoutMs: Number(this.env.VITE_AD_LOAD_TIMEOUT_MS || 4000) });
  }
}

export class ExoClickProvider {
  constructor(env = runtimeEnv()) { this.env = env; this.name = "exoclick"; }
  async load({ placement, context, consent, host, documentRef = typeof document === "undefined" ? null : document, windowRef = typeof window === "undefined" ? null : window }) {
    const config = getExoClickZoneConfig(this.env);
    if (!consent || !host) return { loaded: false, provider: this.name, reason: "contextual-ad-consent-required" };
    if (!config.configured) return { loaded: false, provider: this.name, reason: "adapter-not-configured" };
    const zone = documentRef.createElement("ins");
    zone.className = config.zoneClass;
    zone.dataset.zoneid = config.zoneId;
    zone.dataset.blockAdTypes = "101";
    zone.dataset.ex_av = "2";
    host.replaceChildren(zone);
    host.dataset.adProvider = this.name;
    host.dataset.adPlacement = String(placement || context.surface || "general");
    host.dataset.adContext = JSON.stringify(context);
    const script = await ensureScript(documentRef, config.scriptUrl, { provider: this.name, timeoutMs: Number(this.env.VITE_AD_LOAD_TIMEOUT_MS || 4000) });
    if (!script.loaded) { host.replaceChildren(); return script; }
    const queue = windowRef.AdProvider = windowRef.AdProvider || [];
    queue.push({ serve: {} });
    return { loaded: true, provider: this.name, reason: "zone-requested", zoneId: config.zoneId, sfwOnly: true };
  }
}

export class SponsorPlacementProvider {
  constructor(env = runtimeEnv()) { this.env = env; this.name = "sponsor"; }
  async load({ context, consent, host }) {
    if (!consent || !host) return { loaded: false, provider: this.name, reason: "contextual-ad-consent-required" };
    if (!this.env.VITE_SPONSOR_LABEL) return { loaded: false, provider: this.name, reason: "adapter-not-configured" };
    host.textContent = `SPONSOR / ${this.env.VITE_SPONSOR_LABEL}`;
    host.dataset.adProvider = this.name;
    host.dataset.adContext = JSON.stringify(context);
    return { loaded: true, provider: this.name, reason: "sponsor-label" };
  }
}

export async function loadConfiguredAd(context, host, { consent = false, providerEnabled = false, placement = null, env = runtimeEnv(), documentRef = typeof document === "undefined" ? null : document, windowRef = typeof window === "undefined" ? null : window } = {}) {
  const decision = getAdLoadDecision({ context, consent, providerEnabled });
  if (!decision.load || !host || !documentRef || !windowRef) return { loaded: false, ...decision };
  for (const name of configuredAdProviders(env)) {
    const provider = name === "adsense" ? new AdSenseProvider(env) : name === "exoclick" ? new ExoClickProvider(env) : new SponsorPlacementProvider(env);
    const result = await provider.load({ placement, context, consent, host, documentRef, windowRef });
    if (result.loaded) return { ...result, eligible: true };
  }
  return { loaded: false, eligible: true, reason: "adapter-not-configured" };
}

export async function loadContextualAd(context, host, options) {
  return loadConfiguredAd(context, host, options);
}
