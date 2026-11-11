const truthy = new Set(["1", "true", "on", "yes", "enabled"]);

function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return truthy.has(String(value).toLowerCase());
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function list(value, fallback = []) {
  if (!value) return fallback;
  return String(value).split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export const PROVIDER_KEYS = ["ai", "adsense", "exoclick", "stripe", "paystack", "flutterwave", "contentSync", "emergency", "sms"];

export function createIntegrationConfig(env = {}) {
  const liveTerritories = list(env.FAITHAI_LIVE_TERRITORIES, ["global"]);
  return {
    environment: env.FAITHAI_ENVIRONMENT || env.NODE_ENV || "local",
    liveTerritories,
    providers: {
      ai: asBool(env.FAITHAI_AI_ENABLED),
      adsense: asBool(env.FAITHAI_ADSENSE_ENABLED),
      exoclick: asBool(env.FAITHAI_EXOCLICK_ENABLED),
      stripe: asBool(env.FAITHAI_STRIPE_ENABLED),
      paystack: asBool(env.FAITHAI_PAYSTACK_ENABLED),
      flutterwave: asBool(env.FAITHAI_FLUTTERWAVE_ENABLED),
      contentSync: asBool(env.FAITHAI_CONTENT_SYNC_ENABLED),
      emergency: asBool(env.FAITHAI_EMERGENCY_ENABLED),
      sms: false,
    },
    caps: {
      aiDailyUsd: asNumber(env.FAITHAI_AI_DAILY_USD_CAP, 1),
      aiMonthlyUsd: asNumber(env.FAITHAI_AI_MONTHLY_USD_CAP, 25),
      maxRemoteCallsPerSession: Math.max(0, Math.floor(asNumber(env.FAITHAI_AI_CALLS_PER_SESSION, 3))),
      maxRemoteChars: Math.max(1, Math.floor(asNumber(env.FAITHAI_AI_MAX_CHARS, 2000))),
      estimatedAiCallUsd: asNumber(env.FAITHAI_AI_ESTIMATED_CALL_USD, 0.01),
    },
  };
}

export function territoryEnabled(config, territory = "global") {
  const value = String(territory || "global").toLowerCase();
  return config.liveTerritories.includes("global") || config.liveTerritories.includes(value);
}

export function providerEnabled(config, provider, territory = "global") {
  return Boolean(config?.providers?.[provider] && territoryEnabled(config, territory));
}

export function publicIntegrationStatus(config) {
  return {
    environment: config.environment,
    liveTerritories: [...config.liveTerritories],
    providers: PROVIDER_KEYS.reduce((result, key) => { result[key] = Boolean(config.providers?.[key]); return result; }, {}),
    caps: {
      maxRemoteCallsPerSession: config.caps.maxRemoteCallsPerSession,
      maxRemoteChars: config.caps.maxRemoteChars,
    },
    sms: "simulator-only",
    emergency: "referral-only",
  };
}
