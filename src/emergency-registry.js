const HIGH_IMPACT_KINDS = new Set(["emergency", "domestic-violence", "health", "disaster", "crisis"]);

export function validateEmergencyResource(record) {
  const required = ["id", "service", "territory", "locale", "verificationDate", "expirationDate", "sourceOrganization", "status"];
  const missing = required.filter((field) => !record?.[field]);
  if (!record?.phoneOrShortCode && !record?.webUrl) missing.push("phoneOrShortCode-or-webUrl");
  if (!Array.isArray(record?.reviewers) || record.reviewers.length < (HIGH_IMPACT_KINDS.has(record.kind) ? 2 : 1)) missing.push("reviewers");
  return { valid: missing.length === 0, missing };
}

export function isEmergencyResourceFresh(record, now = new Date()) {
  return record?.status === "approved" && Boolean(record.expirationDate) && new Date(record.expirationDate).getTime() >= new Date(now).getTime();
}

export function listEmergencyResources(records = [], { territory = "global", locale = "en", now = new Date() } = {}) {
  return records.filter((record) => validateEmergencyResource(record).valid && isEmergencyResourceFresh(record, now) && (record.territory === territory || record.territory === "global") && (record.locale === locale || record.locale === "en")).map(({ id, service, kind, territory: recordTerritory, locale: recordLocale, phoneOrShortCode, webUrl, hours, availableChannels, verificationDate, expirationDate, sourceOrganization, reviewers, status }) => ({ id, service, kind, territory: recordTerritory, locale: recordLocale, phoneOrShortCode: phoneOrShortCode || null, webUrl: webUrl || null, hours: hours || "unknown", availableChannels: availableChannels || [], verificationDate, expirationDate, sourceOrganization, reviewers, status }));
}
