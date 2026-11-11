export type Locale = string;
export type Territory = string;

export interface ContentPack {
  id: string;
  kind: "book" | "agriculture" | "aid" | "safety" | "power-credits";
  locale: Locale;
  territory: Territory;
  version: string;
  license: string;
  attribution: string;
  sources: Array<{ title: string; url: string }>;
  reviewers: string[];
  checksum: string;
  size: number;
  publicationDate: string;
  expiration: string;
  status: "prototype" | "approved" | "withdrawn";
}

export interface ResourceRecord {
  id: string;
  topic: string;
  territory: Territory;
  sourceOrganization: string;
  eligibilityText: string;
  deliveryChannel: string;
  verificationDate: string;
  expiration: string;
  stewardStatus: "prototype" | "approved" | "expired" | "withdrawn";
}

export interface Circle {
  id: string;
  codeHash: string;
  invitationScope: string;
  locale: Locale;
  territory: Territory;
  moderationState: string;
  revokedAt?: string;
}

export interface Challenge {
  id: string;
  circleId: string;
  approvedTemplate: string;
  start: string;
  end: string;
  cooperativeGoal?: number;
  moderationState: string;
}

export interface ChallengeProgress {
  challengeId: string;
  devicePseudonym: string;
  response: "done" | "need_help" | "later";
}

export interface Signal {
  id: string;
  source: string;
  reason: string;
  category: string;
  territory: Territory;
  urgency: "routine" | "important" | "urgent";
  validFrom: string;
  validUntil: string;
  permittedChannels: Array<"web" | "pwa" | "sms">;
}

export interface AdContext {
  surface: string;
  locale: Locale;
  territory: Territory;
  ageClass: "unknown" | "youth" | "adult-confirmed";
}

export interface PowerCreditRecord {
  id: string;
  donatedResource?: string;
  restrictions?: string;
  request?: string;
  reviewer?: string;
  allocation?: string;
  receipt: string;
}
