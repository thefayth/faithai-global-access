export const HELP_MENU = [
  { id: 1, key: "challenges", label: "COMMUNITY CHALLENGES", short: "Work together inside a private invitation circle." },
  { id: 2, key: "books", label: "HELP BOOKS", short: "Read, print, or save openly licensed guides." },
  { id: 3, key: "agriculture", label: "FARM + FOOD", short: "Reviewed learning about soil, water, crops, animals, and storage." },
  { id: 4, key: "aid", label: "AID + SERVICES", short: "Find sourced routes without proving poverty or identity." },
  { id: 5, key: "safety", label: "SAFETY GUIDE", short: "Private guidance with a neutral quick exit." },
  { id: 6, key: "power-credits", label: "POWER CREDITS", short: "Request or contribute noncash tools, access, and learning resources." },
  { id: 7, key: "partners", label: "PARTNER + STEWARD INFO", short: "Run a governed local circle or sponsor free access." },
];

const HELP_MENU_TRANSLATIONS = {
  es: [
    ["DESAFÍOS COMUNITARIOS", "Trabajen juntos dentro de un círculo privado por invitación."],
    ["LIBROS DE AYUDA", "Lee, imprime o guarda guías con licencia abierta."],
    ["GRANJA + ALIMENTOS", "Aprendizaje revisado sobre suelo, agua, cultivos, animales y almacenamiento."],
    ["AYUDA + SERVICIOS", "Encuentra rutas con fuentes sin demostrar pobreza ni identidad."],
    ["GUÍA DE SEGURIDAD", "Orientación privada con una salida rápida neutral."],
    ["POWER CREDITS", "Solicita o aporta herramientas, acceso y aprendizaje no monetarios."],
    ["SOCIOS + RESPONSABLES", "Gestiona un círculo local o patrocina el acceso gratuito."],
  ],
  fr: [
    ["DÉFIS COMMUNAUTAIRES", "Agissez ensemble dans un cercle privé sur invitation."],
    ["LIVRES D'AIDE", "Lisez, imprimez ou enregistrez des guides sous licence ouverte."],
    ["AGRICULTURE + ALIMENTATION", "Apprentissage révisé sur le sol, l'eau, les cultures, les animaux et le stockage."],
    ["AIDE + SERVICES", "Trouvez des pistes sourcées sans prouver la pauvreté ni l'identité."],
    ["GUIDE DE SÉCURITÉ", "Conseils privés avec une sortie rapide neutre."],
    ["POWER CREDITS", "Demandez ou apportez des outils, accès et apprentissages non monétaires."],
    ["PARTENAIRES + RESPONSABLES", "Gérez un cercle local ou soutenez l'accès gratuit."],
  ],
  sw: [
    ["CHANGAMOTO ZA JAMII", "Fanyeni kazi pamoja katika duara la faragha la mwaliko."],
    ["VITABU VYA MSAADA", "Soma, chapisha au hifadhi miongozo yenye leseni wazi."],
    ["SHAMBA + CHAKULA", "Mafunzo yaliyopitiwa kuhusu udongo, maji, mazao, wanyama na uhifadhi."],
    ["MSAADA + HUDUMA", "Pata njia zenye vyanzo bila kuthibitisha umaskini au utambulisho."],
    ["MWONGOZO WA USALAMA", "Mwongozo wa faragha wenye njia ya kutoka haraka isiyoonyesha sababu."],
    ["POWER CREDITS", "Omba au changia zana, ufikiaji na mafunzo yasiyo pesa."],
    ["WASHIRIKA + WASIMAMIZI", "Simamia duara la eneo au fadhili ufikiaji wa bure."],
  ],
  ar: [
    ["تحديات مجتمعية", "اعملوا معاً داخل دائرة خاصة بدعوة."],
    ["كتب المساعدة", "اقرأ أو اطبع أو احفظ أدلة بترخيص مفتوح."],
    ["الزراعة + الغذاء", "تعلم مراجع عن التربة والمياه والمحاصيل والحيوانات والتخزين."],
    ["المساعدة + الخدمات", "ابحث عن مسارات موثقة دون إثبات الفقر أو الهوية."],
    ["دليل السلامة", "إرشاد خاص مع خروج سريع ومحايد."],
    ["POWER CREDITS", "اطلب أو ساهم بأدوات وإتاحة وتعلم غير نقدي."],
    ["الشركاء + المشرفون", "أدر دائرة محلية أو ادعم الوصول المجاني."],
  ],
};

export function getHelpMenu(locale = "en") {
  const translations = HELP_MENU_TRANSLATIONS[locale];
  if (!translations) return HELP_MENU;
  return HELP_MENU.map((item, index) => ({ ...item, label: translations[index][0], short: translations[index][1] }));
}

const HELP_CHROME = {
  en: { moreHelp: "MORE HELP", chooseLane: "CHOOSE ONE HELP LANE", coreFree: "Core help is free. No account, ID, payment, ad view, or free-text answer is required.", phoneSimulator: "PHONE SIMULATOR", clearShared: "CLEAR SHARED DEVICE", back: "BACK", quickExit: "QUICK EXIT / WEATHER", done: "DONE", needHelp: "NEED HELP", later: "LATER", saveText: "SAVE TEXT", print: "PRINT", phoneView: "PHONE VIEW", openDemo: "OPEN DEMO CIRCLE" },
  es: { moreHelp: "MÁS AYUDA", chooseLane: "ELIGE UNA RUTA DE AYUDA", coreFree: "La ayuda básica es gratuita. No requiere cuenta, identificación, pago, anuncio ni texto libre.", phoneSimulator: "SIMULADOR DE TELÉFONO", clearShared: "LIMPIAR DISPOSITIVO COMPARTIDO", back: "VOLVER", quickExit: "SALIDA RÁPIDA / CLIMA", done: "HECHO", needHelp: "NECESITO AYUDA", later: "DESPUÉS", saveText: "GUARDAR TEXTO", print: "IMPRIMIR", phoneView: "VISTA DE TELÉFONO", openDemo: "ABRIR CÍRCULO DE DEMOSTRACIÓN" },
  fr: { moreHelp: "AIDE", chooseLane: "CHOISISSEZ UNE PISTE D'AIDE", coreFree: "L'aide essentielle est gratuite. Aucun compte, identité, paiement, publicité ni texte libre n'est requis.", phoneSimulator: "SIMULATEUR TÉLÉPHONE", clearShared: "EFFACER L'APPAREIL PARTAGÉ", back: "RETOUR", quickExit: "SORTIE RAPIDE / MÉTÉO", done: "FAIT", needHelp: "BESOIN D'AIDE", later: "PLUS TARD", saveText: "ENREGISTRER LE TEXTE", print: "IMPRIMER", phoneView: "VUE TÉLÉPHONE", openDemo: "OUVRIR LE CERCLE D'ESSAI" },
  sw: { moreHelp: "MSAADA", chooseLane: "CHAGUA NJIA MOJA YA MSAADA", coreFree: "Msaada wa msingi ni bure. Huhitaji akaunti, kitambulisho, malipo, tangazo au maandishi huru.", phoneSimulator: "KIELELEZO CHA SIMU", clearShared: "FUTA KIFAA CHA PAMOJA", back: "RUDI", quickExit: "TOKA HARAKA / HALI YA HEWA", done: "NIMEFANYA", needHelp: "NAHITAJI MSAADA", later: "BAADAYE", saveText: "HIFADHI MAANDISHI", print: "CHAPISHA", phoneView: "MWONEKANO WA SIMU", openDemo: "FUNGUA DUARA LA MAJARIBIO" },
  ar: { moreHelp: "مساعدة", chooseLane: "اختر مسار مساعدة واحداً", coreFree: "المساعدة الأساسية مجانية. لا يلزم حساب أو هوية أو دفع أو إعلان أو نص حر.", phoneSimulator: "محاكي الهاتف", clearShared: "امسح الجهاز المشترك", back: "رجوع", quickExit: "خروج سريع / الطقس", done: "تم", needHelp: "أحتاج مساعدة", later: "لاحقاً", saveText: "احفظ النص", print: "اطبع", phoneView: "عرض الهاتف", openDemo: "افتح دائرة تجريبية" },
};

export function getHelpChrome(locale = "en") {
  return HELP_CHROME[locale] || HELP_CHROME.en;
}

export const LOCALE_REGISTRY = [
  { locale: "en", label: "English", direction: "ltr", status: "available" },
  { locale: "es", label: "Español", direction: "ltr", status: "available" },
  { locale: "fr", label: "Français", direction: "ltr", status: "available" },
  { locale: "sw", label: "Kiswahili", direction: "ltr", status: "available" },
  { locale: "ar", label: "العربية", direction: "rtl", status: "available" },
  { locale: "pt", label: "Português", direction: "ltr", status: "review-queue" },
  { locale: "hi", label: "हिन्दी", direction: "ltr", status: "review-queue" },
  { locale: "bn", label: "বাংলা", direction: "ltr", status: "review-queue" },
  { locale: "ur", label: "اردو", direction: "rtl", status: "review-queue" },
  { locale: "id", label: "Bahasa Indonesia", direction: "ltr", status: "review-queue" },
  { locale: "ha", label: "Hausa", direction: "ltr", status: "review-queue" },
];

const packBase = {
  locale: "en",
  territory: "global",
  version: "0.1.0",
  license: "CC BY 4.0",
  attribution: "FAITHAI Community Help Series — Faith Cheltenham / Cheltenham Institute",
  reviewers: ["Human regional review required before a governed pilot"],
  checksum: "development-manifest-not-signed",
  publicationDate: "2026-08-06",
  expiration: "2027-02-06",
  status: "prototype",
};

export const CONTENT_PACKS = [
  {
    ...packBase,
    id: "book-small-next-step-en-v1",
    kind: "book",
    title: "The Small Next Step Book",
    size: 3200,
    summary: "A short guide for turning a heavy problem into one safe, specific next action.",
    sources: [{ title: "Original FAITHAI draft", url: "https://faithcheltenham.com" }],
    sections: [
      { title: "Name the need", text: "Choose one need you can describe without sharing private details. A need is not a failure; it is a place to begin." },
      { title: "Shrink the step", text: "Pick an action that can be attempted in one sitting: write one question, gather one document, ask one trusted person, or save one local number." },
      { title: "Leave a receipt", text: "Record what you chose, what you tried, and what should happen next. A receipt protects memory and makes resuming easier." },
    ],
  },
  {
    ...packBase,
    id: "book-community-buying-en-v1",
    kind: "book",
    title: "Cooperative Buying Starter",
    size: 4100,
    summary: "A no-score workbook for neighbors pooling a clearly bounded purchase.",
    sources: [{ title: "Original FAITHAI draft", url: "https://faithcheltenham.com" }],
    sections: [
      { title: "Agree on one item", text: "Write the exact item, quality, total amount, and last acceptable date. Do not collect money until everyone can see the same terms." },
      { title: "Protect the group", text: "Use two-person review for money, keep a receipt, disclose conflicts, and return unused funds according to the written agreement." },
      { title: "Close the loop", text: "Record what arrived, what each person received, and any difference between the estimate and the final cost." },
    ],
  },
  {
    ...packBase,
    id: "ag-soil-water-global-en-v1",
    kind: "agriculture",
    title: "Soil + Water Observation Card",
    size: 2900,
    summary: "Observation-first questions to take to a local extension or farmer organization.",
    sources: [{ title: "FAO digital agricultural advisory guide", url: "https://www.fao.org/family-farming/detail/en/c/1641998/" }],
    sections: [
      { title: "Observe", text: "Record crop, growth stage, recent rain or irrigation, soil texture, drainage, visible pests, and the date. Do not guess a chemical dose." },
      { title: "Ask locally", text: "Share the observation with a recognized extension service, university, veterinarian, or approved farmer organization in your territory." },
      { title: "Check the answer", text: "Confirm the source, crop and location match, date, safety instructions, and whether the advice expires or changes by season." },
    ],
  },
  {
    ...packBase,
    id: "aid-route-global-en-v1",
    kind: "aid",
    title: "Aid Route Preparation Card",
    size: 2600,
    summary: "Prepare questions for a verified service without making an eligibility decision.",
    sources: [{ title: "ICRC humanitarian data protection handbook", url: "https://www.icrc.org/en/publication/430501-handbook-data-protection-humanitarian-action-second-edition" }],
    sections: [
      { title: "Choose a lane", text: "Food, housing, care, education, work, legal navigation, or disaster assistance. Reading this guide requires no ID or poverty proof." },
      { title: "Verify before sharing", text: "Check the organization name, territory, official contact route, verification date, and what information is truly required." },
      { title: "Share less", text: "Start with the minimum information needed to ask a question. Do not send identity documents through an unverified link." },
    ],
  },
  {
    ...packBase,
    id: "safety-private-plan-global-en-v1",
    kind: "safety",
    title: "Private Safety Planning Guide",
    size: 3000,
    summary: "Guidance-only prompts that can be viewed locally and exited quickly.",
    sources: [{ title: "WHO LIVES guidance", url: "https://www.who.int/publications/i/item/9789241517102" }],
    sections: [
      { title: "Listen + validate", text: "Your concern matters. You choose what to view, save, or share. This software is not a clinician or emergency responder." },
      { title: "Enhance safety", text: "Consider a trusted person, a safer place, essential medicine, children or dependents, transport, and a neutral name for any paper plan." },
      { title: "Support", text: "Use a verified local resource when it is safe to do so. FAITHAI does not call, track location, or send a message on your behalf." },
    ],
  },
  {
    ...packBase,
    id: "power-credits-primer-global-en-v1",
    kind: "power-credits",
    title: "Power Credits Primer",
    size: 2400,
    summary: "How noncash donated access can be requested, reviewed, allocated, and receipted.",
    sources: [{ title: "Cheltenham Institute Power Credits plan", url: "https://faithcheltenham.com" }],
    sections: [
      { title: "What counts", text: "Examples include AI tokens, connectivity, devices, software access, training seats, printing, or professional time." },
      { title: "What does not", text: "Power Credits are not cash, an investment, a token for speculation, or a promise of future value." },
      { title: "Keep a receipt", text: "Record the resource, restrictions, request, reviewer, allocation, and delivery result. Keep contribution records separate from operating revenue." },
    ],
  },
];

export function getPacks(kind, locale = "en") {
  return CONTENT_PACKS.filter((pack) => pack.kind === kind && (pack.locale === locale || pack.locale === "en"));
}

export function isPackFresh(pack, now = new Date()) {
  return Boolean(pack.expiration) && new Date(pack.expiration).getTime() >= now.getTime();
}

export function validateContentPack(pack) {
  const required = ["kind", "locale", "territory", "version", "license", "attribution", "sources", "reviewers", "checksum", "size", "publicationDate", "expiration"];
  const missing = required.filter((field) => pack[field] === undefined || pack[field] === null || pack[field] === "");
  if (!Array.isArray(pack.sources) || pack.sources.some((source) => !source.title || !source.url)) missing.push("valid sources");
  if (!Array.isArray(pack.reviewers) || pack.reviewers.length === 0) missing.push("reviewers");
  return { valid: missing.length === 0, missing: [...new Set(missing)] };
}

export function createPackText(pack) {
  const receipt = [
    `FAITHAI CONTENT PACK / ${pack.id}`,
    `${pack.title}`,
    `STATUS: ${pack.status.toUpperCase()} / ${pack.locale} / ${pack.territory}`,
    `VERSION: ${pack.version} / PUBLISHED: ${pack.publicationDate} / EXPIRES: ${pack.expiration}`,
    `LICENSE: ${pack.license}`,
    `ATTRIBUTION: ${pack.attribution}`,
    `REVIEW: ${pack.reviewers.join("; ")}`,
    "",
  ];
  pack.sections.forEach((section, index) => receipt.push(`${index + 1}. ${section.title.toUpperCase()}\n${section.text}\n`));
  receipt.push("SOURCES", ...pack.sources.map((source) => `- ${source.title}: ${source.url}`));
  return receipt.join("\n");
}
