import { territoryEnabled } from "./integration-config.js";

const SAFETY_TERMS = ["not safe", "unsafe", "in danger", "violence", "abuse", "threat", "hurt me", "emergency", "siko salama", "hatari", "غير آمن", "خطر"];
const SENSITIVE_TERMS = ["diagnos", "medication", "dosage", "suicide", "self harm", "legal advice", "immigration status", "eligible for", "eligibility", "medical", "assault", "prescription", "diagnóstico", "medicamento", "violencia", "urgence", "médicament", "dawa", "matibabu", "دواء", "انتحار", "علاج"];
const PRIVATE_INPUT = /\b(?:bisexual|pansexual|lesbian|gay|queer|intersex|transgender|nonbinary|sexuality|religion|christian|muslim|hindu|jewish|race|ethnicity|black|white|latino|latina|asian|disabled|disability|pregnant|pregnancy|hiv|cancer|depression|anxiety|homeless|rent|housing|benefits|hungry|shelter|income|poverty|patient|therapist|caregiver|childcare|eldercare)\b|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+?\d[\d ()-]{7,}\d)/iu;
const INTENTS = new Set(["care", "learning", "tools", "project", "support", "books", "agriculture", "aid", "safety", "challenges", "power"]);

function text(value) { return String(value || "").trim(); }

function containsSafetyLanguage(value) {
  const normalized = text(value).toLocaleLowerCase();
  return SAFETY_TERMS.some((term) => normalized.includes(term));
}

function dayKey(now) { return new Date(now).toISOString().slice(0, 10); }
function monthKey(now) { return new Date(now).toISOString().slice(0, 7); }

export class InMemoryAiBudget {
  constructor() { this.sessions = new Map(); this.days = new Map(); this.months = new Map(); }

  reserve({ sessionKey, estimatedCostUsd, caps, now = Date.now() }) {
    const session = this.sessions.get(sessionKey) || { calls: 0, day: dayKey(now) };
    if (session.day !== dayKey(now)) { session.day = dayKey(now); session.calls = 0; }
    const day = this.days.get(dayKey(now)) || 0;
    const month = this.months.get(monthKey(now)) || 0;
    if (session.calls >= caps.maxRemoteCallsPerSession || day + estimatedCostUsd > caps.aiDailyUsd || month + estimatedCostUsd > caps.aiMonthlyUsd) return false;
    session.calls += 1;
    this.sessions.set(sessionKey, session);
    this.days.set(dayKey(now), day + estimatedCostUsd);
    this.months.set(monthKey(now), month + estimatedCostUsd);
    return true;
  }
}

export function createFantasiaAiPacket({ requestId, locale, territory, scene, consent }) {
  return {
    type: "faithai_public_ai_request",
    requestId,
    locale,
    territory,
    scene,
    consent: Boolean(consent),
    redaction: "approved utterance only; no raw speech, safety exploration, journey history, or ad context",
  };
}

export function createOpenAiCompatibleProvider({ endpoint, apiKey, model = "", providerKind = "openai-compatible", fetcher = fetch, maxOutputTokens = 256, systemPrompt = "Return JSON only with intent, confidence, and followUp. Intent must be care, learning, tools, project, support, books, agriculture, aid, challenges, power, or null. Do not return personal fields or make medical, legal, emergency, or eligibility decisions." } = {}) {
  return {
    configured: Boolean(endpoint && apiKey && model),
    async interpret({ approvedUtterance, locale, territory, scene }) {
      if (!endpoint || !apiKey || !model) throw new Error("ai-provider-not-configured");
      const value = text(approvedUtterance);
      if (value.length > 2000) throw new Error("utterance-too-long");
      const outputLimit = Math.max(1, Math.min(512, Math.floor(maxOutputTokens) || 256));
      const generation = providerKind === "alibaba" ? { temperature: 0.1, max_tokens: outputLimit, enable_thinking: false } : model === "gpt-5.6-luna" ? { max_completion_tokens: outputLimit, reasoning_effort: "none", store: false, service_tier: "default" } : { temperature: 0, max_tokens: outputLimit };
      const response = await fetcher(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, ...generation, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: value }], ...(providerKind === "alibaba" ? {} : { metadata: { locale, territory, scene } }) }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`ai-provider-${response.status}`);
      const payload = await response.json();
      const content = payload.choices?.[0]?.message?.content;
      const result = typeof content === "string" ? JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) : payload;
      if (!result || typeof result !== "object" || (result.intent !== null && !INTENTS.has(result.intent))) throw new Error("invalid-ai-response");
      return { intent: result.intent || null, confidence: Number(result.confidence || 0), extracted: {}, followUp: text(result.followUp).slice(0, 300), usage: payload.usage || {} };
    },
  };
}

export function createAiGateway({ config, provider = null, budget = new InMemoryAiBudget(), now = () => Date.now() }) {
  return {
    async interpret({ approvedUtterance, locale = "en", territory = "global", scene = "listen", consent = false, sessionKey = "anonymous", requestId = "local" }) {
      const value = text(approvedUtterance);
      if (!consent) return { ok: false, code: "consent-required", provenance: "local" };
      if (!value) return { ok: false, code: "utterance-required", provenance: "local" };
      if (containsSafetyLanguage(value)) return { ok: false, code: "safety-local-only", provenance: "local" };
      if (["safety", "emergency", "medical", "health", "legal", "eligibility", "aid", "care", "support"].includes(scene) || SENSITIVE_TERMS.some((term) => value.toLocaleLowerCase().includes(term)) || PRIVATE_INPUT.test(value)) return { ok: false, code: "sensitive-local-only", provenance: "local" };
      if (!config?.providers?.ai || !provider?.configured) return { ok: false, code: "remote-ai-disabled", provenance: "local" };
      if (!territoryEnabled(config, territory)) return { ok: false, code: "ai-territory-disabled", provenance: "local" };
      if (locale !== "en") return { ok: false, code: "ai-locale-disabled", provenance: "local" };
      if (value.length > Math.min(2000, config.caps.maxRemoteChars)) return { ok: false, code: "utterance-too-long", provenance: "local" };
      const current = now();
      if (!(await budget.reserve({ sessionKey, estimatedCostUsd: config.caps.estimatedAiCallUsd, caps: config.caps, now: current }))) return { ok: false, code: "ai-budget-exhausted", provenance: "local" };
      try {
        const result = await provider.interpret({ approvedUtterance: value, locale, territory, scene, requestId });
        return {
          ok: true,
          intent: result.intent || null,
          confidence: Math.max(0, Math.min(1, Number(result.confidence || 0))),
          extracted: result.extracted && typeof result.extracted === "object" ? result.extracted : {},
          followUp: text(result.followUp),
          provenance: "remote",
          requestId,
          packet: createFantasiaAiPacket({ requestId, locale, territory, scene, consent }),
        };
      } catch {
        return { ok: false, code: "remote-ai-unavailable", provenance: "local" };
      }
    },
  };
}
