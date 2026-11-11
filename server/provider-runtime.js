/** Server-only provider construction. Keys and unredacted provider responses never
 * enter public status or application logs. A flag alone does not configure a service.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { createOpenAiCompatibleProvider } from "../src/ai-gateway.js";
import { validatePaymentIntent } from "../src/payment-provider.js";

function enabled(value) { return /^(true|1|on|yes|enabled)$/i.test(String(value || "")); }
function httpsUrl(value) {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url : null; }
  catch { return null; }
}

function alibabaEndpointAllowed(url) {
  if (!url || url.port || url.search || url.hash || url.pathname !== "/compatible-mode/v1/chat/completions") return false;
  const legacyHosts = ["dashscope.aliyuncs.com", "dashscope-intl.aliyuncs.com", "cn-hongkong.dashscope.aliyuncs.com"];
  return legacyHosts.includes(url.hostname) || /^(?!trial\.)[a-z0-9][a-z0-9-]*\.(?:cn-beijing|ap-southeast-1|us-east-1|eu-central-1|ap-northeast-1|cn-hongkong)\.maas\.aliyuncs\.com$/.test(url.hostname);
}

export function verifyStripeSignature(payload, header, secret, now = Date.now(), toleranceSeconds = 300) {
  if (!secret || typeof payload !== "string") return false;
  const parts = String(header || "").split(",").map((part) => part.split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  if (!/^\d+$/.test(timestamp || "") || Math.abs(now / 1000 - Number(timestamp)) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest();
  return parts.filter(([key, value]) => key === "v1" && /^[a-f0-9]{64}$/i.test(value || "")).some(([, value]) => timingSafeEqual(expected, Buffer.from(value, "hex")));
}

export function stripeRevenueEvent(event) {
  const session = event?.data?.object;
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event?.type) || session?.payment_status !== "paid") return null;
  const purpose = session.metadata?.faithai_purpose;
  if (!["donation", "sponsor", "partner-fee"].includes(purpose) || !Number.isSafeInteger(session.amount_total) || session.amount_total <= 0 || !/^[a-z]{3}$/i.test(session.currency || "")) return null;
  return { purpose, provider: "stripe", amountMinor: session.amount_total, currency: session.currency.toUpperCase(), externalId: session.id, eventId: event.id, restrictions: purpose === "donation" ? "Designated contribution; reconcile against donor terms." : null };
}

export function createProviderRuntime(env = {}, { fetcher = fetch, now = () => Date.now() } = {}) {
  const paymentAdapters = {};
  const aiEndpoint = httpsUrl(env.FAITHAI_AI_ENDPOINT);
  const providerKind = String(env.FAITHAI_AI_PROVIDER || "openai-compatible").trim().toLowerCase();
  const supportedKind = ["alibaba", "openai", "openai-compatible"].includes(providerKind);
  const aiKey = String(env.FAITHAI_AI_API_KEY || (providerKind === "alibaba" ? env.DASHSCOPE_API_KEY : "") || "").trim();
  const aiProviderInfo = providerKind === "alibaba" ? { kind: "alibaba", label: "Alibaba Cloud Model Studio" } : providerKind === "openai" || aiEndpoint?.hostname === "api.openai.com" ? { kind: "openai", label: "OpenAI" } : { kind: "openai-compatible", label: "Remote AI provider" };
  const maxCallUsd = Number(env.FAITHAI_AI_MAX_CALL_USD);
  const aiConfigured = Boolean(supportedKind && aiEndpoint && aiKey && String(env.FAITHAI_AI_MODEL || "").trim() && Number.isFinite(maxCallUsd) && maxCallUsd > 0 && (providerKind !== "alibaba" || alibabaEndpointAllowed(aiEndpoint) && !/^sk-sp-/i.test(aiKey)));
  const aiProvider = aiConfigured ? createOpenAiCompatibleProvider({ endpoint: aiEndpoint.href, apiKey: aiKey, model: env.FAITHAI_AI_MODEL, providerKind, fetcher, maxOutputTokens: Number(env.FAITHAI_AI_MAX_OUTPUT_TOKENS || 256) }) : null;
  const returnUrl = httpsUrl(env.FAITHAI_PAYMENT_RETURN_URL);
  const stripeConfigured = Boolean(env.FAITHAI_STRIPE_API_KEY && env.FAITHAI_STRIPE_WEBHOOK_SECRET && returnUrl);
  if (stripeConfigured && enabled(env.FAITHAI_STRIPE_ENABLED)) {
    paymentAdapters.stripe = { provider: "stripe", async createPaymentLink(input) {
      const validation = validatePaymentIntent({ ...input, provider: "stripe" });
      if (!validation.valid || !input.idempotencyKey) return { created: false, code: "invalid-payment-intent", errors: validation.errors };
      const form = new URLSearchParams({ mode: "payment", success_url: returnUrl.href, cancel_url: returnUrl.href, "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": input.currency.toLowerCase(), "line_items[0][price_data][unit_amount]": String(input.amountMinor), "line_items[0][price_data][product_data][name]": input.purpose === "donation" ? "FAITHAI contribution" : input.purpose === "sponsor" ? "FAITHAI sponsorship" : "FAITHAI partner fee", "metadata[faithai_purpose]": input.purpose });
      const response = await fetcher("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${env.FAITHAI_STRIPE_API_KEY}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": input.idempotencyKey }, body: form.toString(), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error("stripe-checkout-unavailable");
      const session = await response.json();
      const url = httpsUrl(session.url);
      if (!url || url.hostname !== "checkout.stripe.com" || !session.id) throw new Error("invalid-stripe-checkout");
      return { created: true, provider: "stripe", externalId: session.id, url: url.href };
    } };
  }
  return {
    aiProvider,
    aiProviderInfo,
    paymentAdapters,
    paymentWebhookVerifier: stripeConfigured && enabled(env.FAITHAI_STRIPE_ENABLED) ? async (payload, signature) => verifyStripeSignature(payload, signature, env.FAITHAI_STRIPE_WEBHOOK_SECRET, now()) : null,
    paymentEventMapper: stripeConfigured ? stripeRevenueEvent : null,
    configured: { ai: aiConfigured, stripe: stripeConfigured },
    maxCallUsd: aiConfigured ? maxCallUsd : null,
  };
}
