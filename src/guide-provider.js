import { getWalkthroughCopy } from "./walkthrough-copy.js";

const TERMS = {
  care: ["care", "caregiver", "caregiving", "babysit", "childcare", "watch my kids", "watch the kids", "elder care", "check on my people", "check on someone", "cuidado", "cuidar", "niños", "soins", "garder les enfants", "huduma", "mtoto", "رعاية", "الأطفال"],
  learning: ["learn", "lern", "learning", "teach", "skill", "school", "skool", "homework", "show me how", "put me on", "study", "class", "aprender", "enseñar", "estudiar", "apprendre", "enseigner", "kujifunza", "fundisha", "تعلم", "دراسة"],
  tools: ["tool", "software", "app", "computer", "laptop", "phone", "device", "internet", "wifi", "data ran out", "connection", "herramienta", "computadora", "logiciel", "ordinateur", "zana", "kompyuta", "أداة", "حاسوب", "إنترنت"],
  project: ["project", "idea", "trying to build", "want to build", "need to build", "build my", "make something", "launch", "business", "side hustle", "prototype", "proyecto", "idea", "negocio", "projet", "entreprise", "mradi", "biashara", "مشروع", "فكرة"],
  support: ["need a hand", "need help", "overwhelmed", "stuck", "support", "recovery", "help me figure", "necesito ayuda", "apoyo", "besoin d'aide", "soutien", "nahitaji msaada", "msaada", "أحتاج مساعدة", "دعم"],
  books: ["book", "read", "manual", "guide", "help book", "library", "libro", "leer", "guía", "livre", "lire", "kitabu", "soma", "كتاب", "قراءة", "دليل"],
  agriculture: ["farm", "farming", "crop", "soil", "seed", "livestock", "harvest", "irrigation", "plant", "garden", "msaada wa kilimo", "kilimo na udongo", "kilimo", "zao", "udongo", "semilla", "cultivo", "granja", "agriculture", "récolte", "مساعدة في زراعة", "زراعة المحصول", "زراعة", "محصول", "تربة"],
  aid: ["food or housing", "food and housing", "food", "housing", "rent", "shelter", "benefits", "legal help", "clinic", "utility bill", "lights off", "hungry", "comida", "vivienda", "alquiler", "beneficios", "nourriture", "logement", "loyer", "chakula", "makazi", "طعام", "سكن", "إيجار"],
  safety: ["not safe", "unsafe", "in danger", "someone is hurting", "being hurt", "violence", "abuse", "threatening me", "afraid to go home", "no estoy segura", "no estoy seguro", "peligro", "violencia", "pas en sécurité", "danger", "violence", "siko salama", "hatari", "si salama", "غير آمن", "خطر", "عنف"],
  challenges: ["community challenge", "challenge", "circle task", "work together", "neighborhood task", "cooperative", "reto comunitario", "juntos", "défi communautaire", "ensemble", "changamoto", "pamoja", "تحدي مجتمعي", "معاً"],
  power: ["power credit", "power credits", "ai tokens", "tokens", "ai credit", "credits for ai", "compute credits", "créditos de ia", "tokens de ia", "jetons ia", "power credits", "tokeni za ai", "رصيد ذكاء", "رموز الذكاء"],
};

const METAPHOR_ONLY = ["this is killing me", "i'm mad", "im mad", "i could scream", "dead tired", "dying to", "that slays", "i'm heated", "im heated"];
const SENSITIVE = new Set(["care", "support", "aid", "safety"]);

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function termScore(input, term) {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm || !input.includes(normalizedTerm)) return 0;
  return normalizedTerm.includes(" ") ? 3 : Math.max(1, Math.min(2, normalizedTerm.length / 5));
}

export function interpretLocally(utterance, locale = "en") {
  const input = normalize(utterance);
  const copy = getWalkthroughCopy(locale);
  if (!input) return { intent: null, confidence: 0, extracted: {}, followUp: copy.choose, provenance: "local", ambiguous: true, sensitive: false };

  const scores = Object.entries(TERMS).map(([intent, terms]) => ({ intent, score: terms.reduce((total, term) => total + termScore(input, term), 0) }));
  const metaphorOnly = METAPHOR_ONLY.some((phrase) => input.includes(normalize(phrase)));
  if (metaphorOnly) {
    const safety = scores.find((item) => item.intent === "safety");
    if (safety) safety.score = 0;
  }
  scores.sort((left, right) => right.score - left.score || left.intent.localeCompare(right.intent));
  const [first, second] = scores;
  if (!first || first.score === 0) return { intent: null, confidence: 0.25, extracted: {}, followUp: copy.choose, provenance: "local", ambiguous: true, sensitive: false };

  const closeTie = second && second.score > 0 && first.score - second.score < 1;
  const confidence = closeTie ? 0.62 : Math.min(0.96, 0.73 + first.score * 0.06);
  return {
    intent: first.intent,
    label: copy.intentLabels[first.intent],
    confidence,
    extracted: {},
    followUp: closeTie ? copy.choose : `${copy.heard}: ${copy.intentLabels[first.intent]}. ${copy.confirm}`,
    provenance: "local",
    ambiguous: closeTie,
    sensitive: SENSITIVE.has(first.intent),
  };
}

export class LocalGuideProvider {
  async interpret({ utterance, locale = "en" }) {
    return interpretLocally(utterance, locale);
  }
}

export class GuideProvider {
  constructor({ remote = null } = {}) {
    this.local = new LocalGuideProvider();
    this.remote = remote;
  }

  async interpret({ utterance, locale = "en", scene = "listen", remoteConsent = false }) {
    const localResult = await this.local.interpret({ utterance, locale, scene });
    const canUseRemote = Boolean(remoteConsent && this.remote?.configured && typeof this.remote.interpret === "function" && localResult.intent !== "safety");
    if (!canUseRemote || !localResult.ambiguous) return localResult;
    try {
      const remoteResult = await this.remote.interpret({ utterance, locale, scene });
      return { ...remoteResult, extracted: remoteResult.extracted || {}, provenance: "remote" };
    } catch {
      return localResult;
    }
  }
}
