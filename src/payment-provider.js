const PAYMENT_PROVIDERS = new Set(["stripe", "paystack", "flutterwave"]);

function bytes(value) { return new TextEncoder().encode(String(value)); }

export function validatePaymentIntent(input = {}) {
  const errors = [];
  if (!PAYMENT_PROVIDERS.has(input.provider)) errors.push("provider");
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) errors.push("amountMinor");
  if (!/^[A-Z]{3}$/.test(String(input.currency || ""))) errors.push("currency");
  if (!input.purpose || !["donation", "sponsor", "partner-fee"].includes(input.purpose)) errors.push("purpose");
  if (input.cardNumber || input.cvv || input.pan) errors.push("card-data-not-accepted");
  return { valid: errors.length === 0, errors };
}

export function createHostedPaymentAdapter({ provider, enabled = false, createSession = null } = {}) {
  return {
    provider,
    async createPaymentLink(input) {
      const valid = validatePaymentIntent({ ...input, provider });
      if (!valid.valid) return { created: false, code: "invalid-payment-intent", errors: valid.errors };
      if (!enabled || typeof createSession !== "function") return { created: false, code: "payment-adapter-disabled" };
      const session = await createSession({ amountMinor: input.amountMinor, currency: input.currency, purpose: input.purpose, returnUrl: input.returnUrl, metadata: input.metadata || {} });
      return { created: true, provider, url: session.url, externalId: session.id || null };
    },
  };
}

function decodeSignature(value) {
  const raw = String(value || "").trim();
  if (/^[0-9a-f]{64}$/i.test(raw)) return Uint8Array.from(raw.match(/.{2}/g).map((part) => parseInt(part, 16)));
  try { return Uint8Array.from(atob(raw), (character) => character.charCodeAt(0)); } catch { return null; }
}

export async function verifyWebhookHmac(payload, signature, secret) {
  const expected = decodeSignature(signature);
  if (!expected || !secret) return false;
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, expected, bytes(payload));
}

export function paymentLedgerType(purpose) {
  return purpose === "donation" ? "restricted" : "earned";
}
