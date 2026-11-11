const HIGH_IMPACT_KINDS = new Set(["agriculture", "aid", "safety", "emergency"]);

function text(value) { return String(value || "").trim(); }

export function validateProviderSource(source = {}) {
  const required = ["id", "name", "baseUrl", "licensePolicy"];
  const missing = required.filter((field) => !text(source[field]));
  let url = null;
  try { url = new URL(source.baseUrl); } catch { missing.push("baseUrl-url"); }
  if (url && !["https:", "http:"].includes(url.protocol)) missing.push("baseUrl-protocol");
  if (!Array.isArray(source.territories) || source.territories.length === 0) missing.push("territories");
  if (!Array.isArray(source.locales) || source.locales.length === 0) missing.push("locales");
  return { valid: missing.length === 0, missing };
}

export function sourceUrlAllowed(source, candidate) {
  try {
    const base = new URL(source.baseUrl);
    const url = new URL(candidate);
    return url.protocol === base.protocol && url.host === base.host && (url.pathname === base.pathname || url.pathname.startsWith(`${base.pathname.replace(/\/$/, "")}/`));
  } catch { return false; }
}

export function validatePublicationReview({ kind, reviewers = [], status = "draft" } = {}) {
  const minimum = HIGH_IMPACT_KINDS.has(kind) && status === "approved" ? 2 : 1;
  return { valid: reviewers.length >= minimum, minimumReviewers: minimum, missing: reviewers.length >= minimum ? [] : ["reviewers"] };
}

export async function createContentPublication({ pack, source, body, reviewers = [], signer = null, now = new Date() } = {}) {
  const sourceCheck = validateProviderSource(source);
  if (!sourceCheck.valid) return { published: false, code: "invalid-source", missing: sourceCheck.missing };
  const review = validatePublicationReview({ kind: pack?.kind, reviewers, status: pack?.status });
  if (!review.valid) return { published: false, code: "review-required", missing: review.missing };
  if (!sourceUrlAllowed(source, pack?.sourceUrl || source.baseUrl)) return { published: false, code: "source-url-not-allowlisted" };
  const bytes = body instanceof Uint8Array ? body : new TextEncoder().encode(String(body || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const receipt = { sourceId: source.id, sourceUrl: pack.sourceUrl || source.baseUrl, license: pack.license, attribution: pack.attribution, reviewers, checksum, publishedAt: new Date(now).toISOString() };
  const signature = typeof signer === "function" ? await signer(JSON.stringify(receipt)) : null;
  return { published: true, pack: { ...pack, checksum, byteSize: bytes.byteLength, publicationDate: receipt.publishedAt, receipt, signature } };
}
