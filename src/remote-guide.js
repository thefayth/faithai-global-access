import { apiUrl } from "./api-url.js";

const SAFE_INTENTS = new Set(["learning", "tools", "project", "books", "agriculture", "challenges", "power"]);
function ephemeralId() {
  const cryptoApi = globalThis.crypto;
  return cryptoApi && typeof cryptoApi.randomUUID === "function" ? cryptoApi.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
const PRIVATE_TERMS = /\b(safe|safety|danger|emergency|abuse|violence|suicid\w*|harm|hurt|threat\w*|food|hungry|rent|housing|homeless|benefit\w*|aid|care|support|child\w*|kid\w*|health|medical|medicin\w*|diagnos\w*|pregnan\w*|doctor|clinic|pain|legal|lawyer|court|immigra\w*|eligible|eligibility|bisexual|sexual\w*|orientation|gay|lesbian|queer|trans\w*|intersex|religion|church|muslim|christian|black|white|race|trauma|password|secret|address)\b/i;

/** Narrow English pilot; unknown or sensitive requests stay in local numbered help. */
export function canOfferRemoteGuide({ utterance, locale, experience, localResult }) {
  const value = String(utterance || "").trim();
  return Boolean(experience === "general" && locale === "en" && value && value.length <= 2000 &&
    localResult?.ambiguous && !localResult.sensitive && SAFE_INTENTS.has(localResult.intent) &&
    !PRIVATE_TERMS.test(value) && !/@|https?:\/\/|(?:\d[\s()+.-]*){7,}/i.test(value));
}

export function createRemoteGuideClient({ base = "", fetcher = fetch, sessionKey = ephemeralId() } = {}) {
  let configured = false;
  let providerLabel = "Online AI provider";
  let pending = null;
  return {
    get providerLabel() { return providerLabel; },
    cancel() { pending?.abort(); },
    async checkAvailability() {
      configured = false;
      try {
        const response = await fetcher(apiUrl("capabilities", base), { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return false;
        const value = await response.json();
        providerLabel = typeof value.aiProvider?.label === "string" ? value.aiProvider.label.slice(0, 80) : "Online AI provider";
        configured = Boolean(value.providers?.ai && value.readiness?.ai?.enabled && value.readiness?.ai?.configured && (value.liveTerritories?.includes("us") || value.liveTerritories?.includes("global")));
      } catch { /* No configured provider means complete local guidance. */ }
      return configured;
    },
    async interpretApproved({ approvedUtterance, consent = false, locale = "en", experience = "general", localResult }) {
      if (!configured || !consent || !canOfferRemoteGuide({ utterance: approvedUtterance, locale, experience, localResult })) return localResult;
      const controller = new AbortController();
      pending = controller;
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetcher(apiUrl("ai/interpret", base), {
          method: "POST", cache: "no-store",
          headers: { "content-type": "application/json", "x-faithai-session": sessionKey },
          body: JSON.stringify({ approvedUtterance, locale, territory: "us", scene: "listen", consent: true, requestId: ephemeralId() }),
          signal: controller.signal,
        });
        if (!response.ok) return localResult;
        const result = await response.json();
        if (!result.ok || !SAFE_INTENTS.has(result.intent) || !Number.isFinite(result.confidence)) return localResult;
        return { intent: result.intent, confidence: Math.max(0, Math.min(1, result.confidence)), extracted: {}, provenance: "remote", ambiguous: result.confidence < 0.7, sensitive: false };
      } catch { return localResult; }
      finally { clearTimeout(timeout); if (pending === controller) pending = null; }
    },
  };
}
