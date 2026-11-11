import { OPTIONS } from "./faithai-data.js";

export const LANGUAGES = [
  { code: "en", number: 1, label: "English", dir: "ltr", asciiCapable: true },
  { code: "es", number: 2, label: "Español", dir: "ltr", asciiCapable: true },
  { code: "fr", number: 3, label: "Français", dir: "ltr", asciiCapable: true },
  { code: "sw", number: 4, label: "Kiswahili", dir: "ltr", asciiCapable: true },
  { code: "ar", number: 5, label: "العربية", dir: "rtl", asciiCapable: false },
];

const en = {
  brandInstitute: "THE CHELTENHAM INSTITUTE",
  ask: "WHAT DO YOU HAVE OR NEED TODAY?",
  chooseLater: "Choose what fits best. You can change it later.",
  resultStep: "ONE USEFUL NEXT STEP",
  resultHistory: "LOCAL HISTORY",
  resultSignals: "SIGNAL INBOX",
  resultPacket: "TEXT PACKET",
  resultLanguage: "LANGUAGE",
  text: "TEXT",
  visual: "VISUAL",
  phoneView: "PHONE / TEXT VIEW",
  phoneAsk: "WHAT DO YOU HAVE OR NEED?",
  replyMain: "REPLY 0-5 / M MORE HELP / L LANGUAGE / A SIGNALS / H JOURNEY",
  path: "PATH",
  chooseFocus: "CHOOSE ONE FOCUS",
  selected: "SELECTED",
  next: "NEXT",
  savedAs: "SAVED AS {id}. NOTHING SENT.",
  who: "WHO",
  how: "HOW",
  replyFocus: "REPLY 1-{count} / S SAVE / D DONE / E EXPORT / I INFO / 0 BACK",
  noDirectory: "NO DIRECTORY. NOTHING SENT WITHOUT YOU.",
  oneStep: "ONE USEFUL NEXT STEP",
  pressFocus: "PRESS 1-{count} TO CHOOSE A FOCUS.",
  saveFocused: "[S] SAVE FOCUSED STEP",
  savedReceipt: "[S] SAVED AS {id}",
  exportPacket: "[E] TEXT PACKET",
  moreInfo: "MORE INFO",
  lessInfo: "LESS INFO",
  back: "BACK",
  globalRoots: "GLOBAL, WITH ROOTS",
  globalRootsText: "Open globally and rooted in The Cheltenham Institute's Black-led equity model. Need is prioritized; identity is never used to reduce access.",
  loopHint: "CHOOSE > FOCUS > SAVE > DO. NOTHING LEAVES THIS DEVICE.",
  historyLedger: "LOCAL ACTIVITY LEDGER",
  historySaved: "YOUR SAVED NEXT STEPS",
  historyEmpty: "NOTHING IS SAVED YET.",
  historyIntro: "This is a private list on this browser. It is not a member profile or public activity feed.",
  olderReceipts: "{count} older local receipts remain saved.",
  removeAll: "REMOVE ALL FAITHAI DATA SAVED BY THIS PROTOTYPE ON THIS BROWSER?",
  remove: "REMOVE",
  keep: "KEEP IT",
  clearData: "CLEAR LOCAL DATA",
  completedStatus: "DONE",
  savedStatus: "SAVED",
  packetReady: "PHONE-READY TEXT PACKET",
  packetIntro: "Copy, download, or read this as plain text. FAITHAI does not send it for you.",
  copy: "COPY",
  download: "DOWNLOAD .TXT",
  copied: "Copied after your command. Nothing was sent.",
  copyUnavailable: "Copy is unavailable here. The full text remains visible for manual selection.",
  downloaded: "Downloaded locally after your command. Nothing was sent.",
  signalsHeading: "AI ACCESS SIGNALS",
  signalsSub: "OPT-IN / CONTEXTUAL / EXPLAINED",
  saveFirst: "SAVE A FOCUSED STEP FIRST.",
  signalHelp: "Signals use only numbered choices you explicitly save on this device. Choose a path, choose its focus, then press S.",
  backMenu: "BACK TO MENU",
  context: "CONTEXT",
  localStep: "LOCAL STEP",
  localSteps: "LOCAL STEPS",
  receiveSignals: "RECEIVE RANKED SIGNALS FROM SAVED INPUT?",
  signalConsent: "This prototype can rank access, support, privacy, and deadline reminders. It does not contact a carrier or outside service.",
  turnOn: "TURN SIGNALS ON",
  keepOff: "KEEP SIGNALS OFF",
  muted: "SIGNALS MUTED.",
  mutedHelp: "No signal will interrupt you. Press Y when you want to resume the local inbox.",
  resume: "RESUME",
  synthetic: "SYNTHETIC PREVIEW / AI RANKED / YOU DECIDE",
  of: "OF",
  contextScore: "CONTEXT SCORE",
  why: "WHY THIS REACHED YOU",
  aiUsed: "WHAT THE AI USED",
  aiUsedText: "Only the local activity ledger - not contacts, a directory, private archives, identity scoring, or a hidden profile.",
  aiDidNot: "WHAT IT DID NOT DO",
  aiDidNotText: "No message, match, introduction, payment, disclosure, or public post was activated.",
  details: "DETAILS",
  less: "LESS",
  nextSignal: "NEXT",
  previous: "PREVIOUS",
  save: "SAVE",
  saved: "SAVED",
  mute: "MUTE",
  signalSaved: "Signal saved on this device. No response was sent.",
  storageError: "Local storage is unavailable. The interface still works, but receipts cannot be kept.",
  chooseBeforeSave: "Choose a numbered focus before saving.",
  savedLocal: "Saved locally as {id}. It was not sent or published.",
  chooseBeforePacket: "Choose a numbered focus before creating a text packet.",
  reopened: "Reopened local receipt {id}. Nothing was sent.",
  saveBlocked: "This browser blocked local saving. Your step remains visible and was not sent.",
  footerPhone: "PHONE MODE: REPLY 0-5",
  footerHelp: "MORE HELP",
  footerSignals: "SIGNALS",
  footerHistory: "LOCAL HISTORY",
  footerScope: "SCOPED VIEW / NO DIRECTORY / NOTHING SENT WITHOUT YOU",
  footerLanguage: "LANGUAGE",
  languageTitle: "CHOOSE YOUR LANGUAGE",
  languageIntro: "Language packs live on this device. Changing language does not send your choices anywhere.",
  languageNote: "NUMBER COMMANDS STAY THE SAME IN EVERY LANGUAGE.",
  asciiMode: "PHONE ASCII",
  asciiOn: "ON",
  asciiOff: "OFF",
  asciiUnavailable: "NOT AVAILABLE FOR THIS SCRIPT",
  current: "CURRENT",
  journeyTitle: "TODAY'S 2-MINUTE JOURNEY",
  stageChoose: "CHOOSE",
  stageFocus: "FOCUS",
  stageSave: "SAVE",
  stageDo: "DO",
  markDone: "[D] MARK THIS STEP DONE",
  checkpointComplete: "CHECKPOINT COMPLETE",
  completionMessage: "You completed one useful step. No points or ranking - your progress belongs to you.",
  startAnother: "START ANOTHER",
  progressSaved: "{saved} SAVED",
  progressDone: "{done} DONE",
  packetLocalStep: "FAITHAI LOCAL STEP",
  receipt: "RECEIPT",
  focus: "FOCUS",
  statusNotSent: "STATUS SAVED ON THIS DEVICE / NOT SENT",
  packetCommands: "COMMANDS M MORE HELP / L LANGUAGE / A SIGNALS / H JOURNEY / 0 MENU",
  signalPreview: "FAITHAI SIGNAL PREVIEW",
  signal: "SIGNAL",
  priority: "PRIORITY",
  statusSynthetic: "STATUS SYNTHETIC / NOTHING SENT OR ACTIVATED",
  signalCommands: "REPLY 1 DETAILS / 2 NEXT / 8 PREVIOUS / S SAVE / X MUTE",
};

const es = {
  ...en,
  brandInstitute: "EL INSTITUTO CHELTENHAM",
  ask: "¿QUÉ TIENES O NECESITAS HOY?",
  chooseLater: "Elige lo que mejor encaje. Puedes cambiarlo después.",
  resultStep: "UN PRÓXIMO PASO ÚTIL",
  resultHistory: "HISTORIAL LOCAL",
  resultSignals: "BANDEJA DE SEÑALES",
  resultPacket: "PAQUETE DE TEXTO",
  resultLanguage: "IDIOMA",
  text: "TEXTO", visual: "VISUAL",
  phoneView: "VISTA DE TELÉFONO / TEXTO", phoneAsk: "¿QUÉ TIENES O NECESITAS?",
  replyMain: "RESPONDE 0-5 / M MÁS AYUDA / L IDIOMA / A SEÑALES / H RUTA",
  path: "RUTA", chooseFocus: "ELIGE UN ENFOQUE", selected: "SELECCIONADO", next: "SIGUIENTE",
  savedAs: "GUARDADO COMO {id}. NADA ENVIADO.", who: "PARA QUIÉN", how: "CÓMO",
  replyFocus: "RESPONDE 1-{count} / S GUARDAR / D HECHO / E EXPORTAR / I INFO / 0 ATRÁS",
  noDirectory: "SIN DIRECTORIO. NADA SE ENVÍA SIN TI.", oneStep: "UN PRÓXIMO PASO ÚTIL",
  pressFocus: "PULSA 1-{count} PARA ELEGIR UN ENFOQUE.", saveFocused: "[S] GUARDAR PASO",
  savedReceipt: "[S] GUARDADO COMO {id}", exportPacket: "[E] PAQUETE DE TEXTO",
  moreInfo: "MÁS INFORMACIÓN", lessInfo: "MENOS INFORMACIÓN", back: "ATRÁS",
  globalRoots: "GLOBAL, CON RAÍCES", globalRootsText: "Abierto al mundo y arraigado en el modelo de equidad liderado por personas negras del Instituto Cheltenham. La necesidad tiene prioridad; la identidad nunca reduce el acceso.",
  loopHint: "ELIGE > ENFOCA > GUARDA > HAZ. NADA SALE DE ESTE DISPOSITIVO.",
  historyLedger: "REGISTRO LOCAL", historySaved: "TUS PRÓXIMOS PASOS", historyEmpty: "AÚN NO HAY NADA GUARDADO.",
  historyIntro: "Esta es una lista privada en este navegador. No es un perfil ni una actividad pública.", olderReceipts: "Quedan {count} recibos locales anteriores.",
  removeAll: "¿BORRAR TODOS LOS DATOS DE FAITHAI GUARDADOS EN ESTE NAVEGADOR?", remove: "BORRAR", keep: "CONSERVAR", clearData: "BORRAR DATOS LOCALES",
  completedStatus: "HECHO", savedStatus: "GUARDADO", packetReady: "PAQUETE DE TEXTO PARA TELÉFONO",
  packetIntro: "Copia, descarga o lee este texto. FAITHAI no lo envía por ti.", copy: "COPIAR", download: "DESCARGAR .TXT",
  copied: "Copiado por tu orden. Nada fue enviado.", copyUnavailable: "No se puede copiar aquí. El texto completo sigue visible.", downloaded: "Descargado localmente. Nada fue enviado.",
  signalsHeading: "SEÑALES DE ACCESO IA", signalsSub: "VOLUNTARIO / CONTEXTUAL / EXPLICADO", saveFirst: "GUARDA PRIMERO UN PASO CONCRETO.",
  signalHelp: "Las señales solo usan elecciones numeradas que guardas en este dispositivo.", backMenu: "VOLVER AL MENÚ", context: "CONTEXTO", localStep: "PASO LOCAL", localSteps: "PASOS LOCALES",
  receiveSignals: "¿RECIBIR SEÑALES ORDENADAS DESDE TUS DATOS GUARDADOS?", signalConsent: "Este prototipo ordena recordatorios de acceso, apoyo, privacidad y fechas. No contacta a ninguna empresa telefónica.",
  turnOn: "ACTIVAR SEÑALES", keepOff: "MANTENER APAGADAS", muted: "SEÑALES SILENCIADAS.", mutedHelp: "No te interrumpirán. Pulsa Y para reanudar.", resume: "REANUDAR",
  synthetic: "VISTA SINTÉTICA / IA ORDENA / TÚ DECIDES", of: "DE", contextScore: "PUNTUACIÓN DE CONTEXTO", why: "POR QUÉ TE LLEGÓ",
  aiUsed: "QUÉ USÓ LA IA", aiUsedText: "Solo el registro local; no contactos, directorios, archivos privados ni perfiles ocultos.", aiDidNot: "QUÉ NO HIZO", aiDidNotText: "No activó mensajes, contactos, pagos, divulgaciones ni publicaciones.",
  details: "DETALLES", less: "MENOS", nextSignal: "SIGUIENTE", previous: "ANTERIOR", save: "GUARDAR", saved: "GUARDADO", mute: "SILENCIAR", signalSaved: "Señal guardada aquí. No se envió respuesta.",
  storageError: "El almacenamiento local no está disponible. La interfaz funciona, pero no puede guardar recibos.", chooseBeforeSave: "Elige un enfoque numerado antes de guardar.",
  savedLocal: "Guardado localmente como {id}. No fue enviado ni publicado.", chooseBeforePacket: "Elige un enfoque antes de crear el paquete.", reopened: "Recibo local {id} abierto. Nada enviado.", saveBlocked: "El navegador bloqueó el guardado. El paso sigue visible y no fue enviado.",
  footerPhone: "MODO TELÉFONO: RESPONDE 0-5", footerHelp: "MÁS AYUDA", footerSignals: "SEÑALES", footerHistory: "HISTORIAL LOCAL", footerScope: "VISTA LIMITADA / SIN DIRECTORIO / NADA SE ENVÍA SIN TI", footerLanguage: "IDIOMA",
  languageTitle: "ELIGE TU IDIOMA", languageIntro: "Los idiomas viven en este dispositivo. Cambiar idioma no envía tus elecciones.", languageNote: "LOS NÚMEROS SON IGUALES EN TODOS LOS IDIOMAS.",
  asciiMode: "ASCII DEL TELÉFONO", asciiOn: "SÍ", asciiOff: "NO", asciiUnavailable: "NO DISPONIBLE PARA ESTA ESCRITURA", current: "ACTUAL",
  journeyTitle: "TU RECORRIDO DE 2 MINUTOS", stageChoose: "ELIGE", stageFocus: "ENFOCA", stageSave: "GUARDA", stageDo: "HAZ", markDone: "[D] MARCAR COMO HECHO",
  checkpointComplete: "PASO COMPLETADO", completionMessage: "Completaste un paso útil. Sin puntos ni rangos: tu progreso te pertenece.", startAnother: "EMPEZAR OTRO",
  progressSaved: "{saved} GUARDADOS", progressDone: "{done} HECHOS", packetLocalStep: "PASO LOCAL FAITHAI", receipt: "RECIBO", focus: "ENFOQUE",
  statusNotSent: "ESTADO GUARDADO EN ESTE DISPOSITIVO / NO ENVIADO", packetCommands: "COMANDOS M MÁS AYUDA / L IDIOMA / A SEÑALES / H RUTA / 0 MENÚ",
  signalPreview: "VISTA DE SEÑAL FAITHAI", signal: "SEÑAL", priority: "PRIORIDAD", statusSynthetic: "ESTADO SINTÉTICO / NADA ENVIADO NI ACTIVADO",
  signalCommands: "RESPONDE 1 DETALLES / 2 SIGUIENTE / 8 ANTERIOR / S GUARDAR / X SILENCIAR",
};

const fr = {
  ...en,
  brandInstitute: "L'INSTITUT CHELTENHAM", ask: "QU'AVEZ-VOUS OU DE QUOI AVEZ-VOUS BESOIN ?", chooseLater: "Choisissez ce qui convient. Vous pourrez changer plus tard.",
  resultStep: "UNE PROCHAINE ÉTAPE UTILE", resultHistory: "HISTORIQUE LOCAL", resultSignals: "BOÎTE DE SIGNAUX", resultPacket: "PAQUET TEXTE", resultLanguage: "LANGUE",
  text: "TEXTE", visual: "VISUEL", phoneView: "VUE TÉLÉPHONE / TEXTE", phoneAsk: "QU'AVEZ-VOUS OU QUE VOUS FAUT-IL ?", replyMain: "RÉPONDEZ 0-5 / M AIDE / L LANGUE / A SIGNAUX / H PARCOURS",
  path: "PARCOURS", chooseFocus: "CHOISISSEZ UN OBJECTIF", selected: "SÉLECTIONNÉ", next: "SUITE", savedAs: "ENREGISTRÉ SOUS {id}. RIEN ENVOYÉ.", who: "POUR QUI", how: "COMMENT",
  replyFocus: "RÉPONDEZ 1-{count} / S GARDER / D FAIT / E EXPORTER / I INFO / 0 RETOUR", noDirectory: "AUCUN ANNUAIRE. RIEN N'EST ENVOYÉ SANS VOUS.",
  oneStep: "UNE PROCHAINE ÉTAPE UTILE", pressFocus: "APPUYEZ SUR 1-{count} POUR CHOISIR.", saveFocused: "[S] GARDER L'ÉTAPE", savedReceipt: "[S] ENREGISTRÉ {id}",
  exportPacket: "[E] PAQUET TEXTE", moreInfo: "PLUS D'INFOS", lessInfo: "MOINS D'INFOS", back: "RETOUR",
  globalRoots: "MONDIAL, AVEC DES RACINES", globalRootsText: "Ouvert au monde et ancré dans le modèle d'équité dirigé par des personnes noires de l'Institut Cheltenham. Le besoin passe d'abord; l'identité ne réduit jamais l'accès.",
  loopHint: "CHOISIR > CIBLER > GARDER > FAIRE. RIEN NE QUITTE CET APPAREIL.", historyLedger: "REGISTRE LOCAL", historySaved: "VOS PROCHAINES ÉTAPES", historyEmpty: "RIEN N'EST ENREGISTRÉ.",
  historyIntro: "Liste privée dans ce navigateur. Ce n'est ni un profil ni un fil public.", olderReceipts: "{count} anciens reçus locaux restent enregistrés.", removeAll: "SUPPRIMER TOUTES LES DONNÉES FAITHAI DE CE NAVIGATEUR ?",
  remove: "SUPPRIMER", keep: "GARDER", clearData: "EFFACER LES DONNÉES", completedStatus: "FAIT", savedStatus: "GARDÉ", packetReady: "PAQUET TEXTE POUR TÉLÉPHONE",
  packetIntro: "Copiez, téléchargez ou lisez ce texte. FAITHAI ne l'envoie pas.", copy: "COPIER", download: "TÉLÉCHARGER .TXT", copied: "Copié sur votre ordre. Rien envoyé.",
  copyUnavailable: "La copie n'est pas disponible. Le texte reste visible.", downloaded: "Téléchargé localement. Rien envoyé.", signalsHeading: "SIGNAUX D'ACCÈS IA", signalsSub: "CHOISI / CONTEXTUEL / EXPLIQUÉ",
  saveFirst: "GARDEZ D'ABORD UNE ÉTAPE PRÉCISE.", signalHelp: "Les signaux utilisent seulement les choix numérotés gardés sur cet appareil.", backMenu: "RETOUR AU MENU", context: "CONTEXTE", localStep: "ÉTAPE LOCALE", localSteps: "ÉTAPES LOCALES",
  receiveSignals: "RECEVOIR DES SIGNAUX CLASSÉS DEPUIS VOS CHOIX ?", signalConsent: "Ce prototype classe les rappels d'accès, de soutien, de confidentialité et de délai. Il ne contacte aucun opérateur.",
  turnOn: "ACTIVER", keepOff: "LAISSER DÉSACTIVÉ", muted: "SIGNAUX COUPÉS.", mutedHelp: "Aucun signal ne vous interrompra. Appuyez sur Y pour reprendre.", resume: "REPRENDRE",
  synthetic: "APERÇU SYNTHÉTIQUE / IA CLASSE / VOUS DÉCIDEZ", of: "SUR", contextScore: "SCORE CONTEXTUEL", why: "POURQUOI CE SIGNAL", aiUsed: "CE QUE L'IA A UTILISÉ",
  aiUsedText: "Seulement le registre local; pas de contacts, annuaire, archives privées ni profil caché.", aiDidNot: "CE QU'ELLE N'A PAS FAIT", aiDidNotText: "Aucun message, contact, paiement, partage ou publication n'a été activé.",
  details: "DÉTAILS", less: "MOINS", nextSignal: "SUIVANT", previous: "PRÉCÉDENT", save: "GARDER", saved: "GARDÉ", mute: "COUPER", signalSaved: "Signal gardé ici. Aucune réponse envoyée.",
  storageError: "Le stockage local est indisponible. L'interface fonctionne mais ne peut pas garder de reçus.", chooseBeforeSave: "Choisissez un objectif numéroté avant d'enregistrer.", savedLocal: "Enregistré localement sous {id}. Rien envoyé ni publié.",
  chooseBeforePacket: "Choisissez un objectif avant de créer le paquet.", reopened: "Reçu local {id} rouvert. Rien envoyé.", saveBlocked: "Le navigateur a bloqué l'enregistrement. L'étape reste visible.",
  footerPhone: "MODE TÉLÉPHONE : RÉPONDEZ 0-5", footerHelp: "AIDE", footerSignals: "SIGNAUX", footerHistory: "HISTORIQUE LOCAL", footerScope: "VUE LIMITÉE / AUCUN ANNUAIRE / RIEN ENVOYÉ SANS VOUS", footerLanguage: "LANGUE",
  languageTitle: "CHOISISSEZ VOTRE LANGUE", languageIntro: "Les langues vivent sur cet appareil. Le changement n'envoie aucun choix.", languageNote: "LES COMMANDES NUMÉRIQUES RESTENT IDENTIQUES.", asciiMode: "ASCII TÉLÉPHONE", asciiOn: "OUI", asciiOff: "NON", asciiUnavailable: "INDISPONIBLE POUR CETTE ÉCRITURE", current: "ACTUEL",
  journeyTitle: "VOTRE PARCOURS DE 2 MINUTES", stageChoose: "CHOISIR", stageFocus: "CIBLER", stageSave: "GARDER", stageDo: "FAIRE", markDone: "[D] MARQUER COMME FAIT",
  checkpointComplete: "ÉTAPE TERMINÉE", completionMessage: "Vous avez terminé une étape utile. Aucun point ni classement : ce progrès vous appartient.", startAnother: "RECOMMENCER",
  progressSaved: "{saved} GARDÉS", progressDone: "{done} FAITS", packetLocalStep: "ÉTAPE LOCALE FAITHAI", receipt: "REÇU", focus: "OBJECTIF", statusNotSent: "ÉTAT GARDÉ SUR CET APPAREIL / NON ENVOYÉ",
  packetCommands: "COMMANDES M AIDE / L LANGUE / A SIGNAUX / H PARCOURS / 0 MENU", signalPreview: "APERÇU DE SIGNAL FAITHAI", signal: "SIGNAL", priority: "PRIORITÉ", statusSynthetic: "ÉTAT SYNTHÉTIQUE / RIEN ENVOYÉ NI ACTIVÉ",
  signalCommands: "RÉPONDEZ 1 DÉTAILS / 2 SUIVANT / 8 PRÉCÉDENT / S GARDER / X COUPER",
};

const sw = {
  ...en,
  brandInstitute: "TAASISI YA CHELTENHAM", ask: "UNA NINI AU UNAHITAJI NINI LEO?", chooseLater: "Chagua kinachokufaa. Unaweza kubadilisha baadaye.",
  resultStep: "HATUA MOJA MUHIMU", resultHistory: "HISTORIA YA KIFAA", resultSignals: "KIKASHA CHA ISHARA", resultPacket: "KIFURUSHI CHA MAANDISHI", resultLanguage: "LUGHA",
  text: "MAANDISHI", visual: "PICHA", phoneView: "MWONEKANO WA SIMU / MAANDISHI", phoneAsk: "UNA NINI AU UNAHITAJI NINI?", replyMain: "JIBU 0-5 / M MSAADA / L LUGHA / A ISHARA / H SAFARI",
  path: "NJIA", chooseFocus: "CHAGUA LENGO MOJA", selected: "IMECHAGULIWA", next: "HATUA", savedAs: "IMEHIFADHIWA KAMA {id}. HAKUNA KILICHOTUMWA.", who: "KWA NANI", how: "JINSI",
  replyFocus: "JIBU 1-{count} / S HIFADHI / D IMEKWISHA / E HAMISHA / I MAELEZO / 0 RUDI", noDirectory: "HAKUNA ORODHA YA WATU. HAKUNA KINACHOTUMWA BILA WEWE.",
  oneStep: "HATUA MOJA MUHIMU", pressFocus: "BONYEZA 1-{count} KUCHAGUA LENGO.", saveFocused: "[S] HIFADHI HATUA", savedReceipt: "[S] IMEHIFADHIWA {id}", exportPacket: "[E] KIFURUSHI CHA MAANDISHI",
  moreInfo: "MAELEZO ZAIDI", lessInfo: "MAELEZO MACHACHE", back: "RUDI", globalRoots: "DUNIANI, YENYE MIZIZI", globalRootsText: "Wazi duniani na yenye mizizi katika usawa unaoongozwa na watu Weusi wa Taasisi ya Cheltenham. Uhitaji hupewa kipaumbele; utambulisho haupunguzi upatikanaji.",
  loopHint: "CHAGUA > LENGA > HIFADHI > FANYA. HAKUNA KINACHOTOKA KWENYE KIFAA.", historyLedger: "KUMBUKUMBU YA KIFAA", historySaved: "HATUA ZAKO ZILIZOHIFADHIWA", historyEmpty: "BADO HAKUNA KILICHOHIFADHIWA.",
  historyIntro: "Hii ni orodha ya binafsi katika kivinjari hiki. Si wasifu wala habari za umma.", olderReceipts: "Kuna risiti {count} za zamani.", removeAll: "FUTA DATA YOTE YA FAITHAI KWENYE KIVINJARI HIKI?", remove: "FUTA", keep: "WEKA", clearData: "FUTA DATA YA KIFAA",
  completedStatus: "IMEKWISHA", savedStatus: "IMEHIFADHIWA", packetReady: "KIFURUSHI CHA MAANDISHI CHA SIMU", packetIntro: "Nakili, pakua, au soma maandishi haya. FAITHAI haitumi kwa niaba yako.", copy: "NAKILI", download: "PAKUA .TXT",
  copied: "Imenakiliwa kwa amri yako. Hakuna kilichotumwa.", copyUnavailable: "Kunakili hakupatikani hapa. Maandishi bado yanaonekana.", downloaded: "Imepakuliwa kwenye kifaa. Hakuna kilichotumwa.",
  signalsHeading: "ISHARA ZA UPATIKANAJI WA AI", signalsSub: "KWA RIDHAA / KWA MUKTADHA / IMEELEZWA", saveFirst: "HIFADHI KWANZA HATUA MAALUM.", signalHelp: "Ishara hutumia tu chaguo za namba ulizohifadhi kwenye kifaa hiki.", backMenu: "RUDI KWENYE MENYU", context: "MUKTADHA", localStep: "HATUA YA KIFAA", localSteps: "HATUA ZA KIFAA",
  receiveSignals: "POKEA ISHARA ZILIZOPANGWA KUTOKA KWA CHAGUO ZAKO?", signalConsent: "Mfano huu hupanga vikumbusho vya upatikanaji, msaada, faragha na muda. Hauwasiliani na kampuni ya simu.", turnOn: "WASHA ISHARA", keepOff: "ACHA ZIMEZIMWA", muted: "ISHARA ZIMENYAMAZISHWA.", mutedHelp: "Hakuna ishara itakayokusumbua. Bonyeza Y kuendelea.", resume: "ENDELEA",
  synthetic: "MFANO TU / AI IMEPANGA / WEWE UNAAMUA", of: "KATI YA", contextScore: "ALAMA YA MUKTADHA", why: "KWA NINI UMEIPATA", aiUsed: "AI ILITUMIA NINI", aiUsedText: "Kumbukumbu ya kifaa tu; si mawasiliano, orodha ya watu, nyaraka binafsi, au wasifu uliofichwa.", aiDidNot: "HAIKUFANYA NINI", aiDidNotText: "Hakuna ujumbe, utambulisho, malipo, ufichuaji, au chapisho lililoanzishwa.",
  details: "MAELEZO", less: "PUNGUZA", nextSignal: "INAYOFUATA", previous: "ILIYOPITA", save: "HIFADHI", saved: "IMEHIFADHIWA", mute: "NYAMAZISHA", signalSaved: "Ishara imehifadhiwa hapa. Hakuna jibu lililotumwa.",
  storageError: "Hifadhi ya kifaa haipatikani. Mfumo unafanya kazi lakini hauwezi kuweka risiti.", chooseBeforeSave: "Chagua lengo lenye namba kabla ya kuhifadhi.", savedLocal: "Imehifadhiwa hapa kama {id}. Haikutumwa wala kuchapishwa.", chooseBeforePacket: "Chagua lengo kabla ya kutengeneza kifurushi.", reopened: "Risiti {id} imefunguliwa. Hakuna kilichotumwa.", saveBlocked: "Kivinjari kimezuia kuhifadhi. Hatua bado inaonekana na haikutumwa.",
  footerPhone: "HALI YA SIMU: JIBU 0-5", footerHelp: "MSAADA", footerSignals: "ISHARA", footerHistory: "HISTORIA YA KIFAA", footerScope: "MWONEKANO MAALUM / HAKUNA ORODHA / HAKUNA KINACHOTUMWA BILA WEWE", footerLanguage: "LUGHA",
  languageTitle: "CHAGUA LUGHA YAKO", languageIntro: "Lugha ziko kwenye kifaa hiki. Kubadilisha lugha hakutumi chaguo zako.", languageNote: "AMRI ZA NAMBA NI SAWA KATIKA KILA LUGHA.", asciiMode: "ASCII YA SIMU", asciiOn: "IMEWASHWA", asciiOff: "IMEZIMWA", asciiUnavailable: "HAIPATIKANI KWA MAANDISHI HAYA", current: "YA SASA",
  journeyTitle: "SAFARI YAKO YA DAKIKA 2", stageChoose: "CHAGUA", stageFocus: "LENGA", stageSave: "HIFADHI", stageDo: "FANYA", markDone: "[D] WEKA HATUA IMEKWISHA", checkpointComplete: "HATUA IMEKAMILIKA", completionMessage: "Umekamilisha hatua moja muhimu. Hakuna pointi wala nafasi: maendeleo ni yako.", startAnother: "ANZA NYINGINE",
  progressSaved: "{saved} ZIMEHIFADHIWA", progressDone: "{done} ZIMEKWISHA", packetLocalStep: "HATUA YA FAITHAI", receipt: "RISITI", focus: "LENGO", statusNotSent: "HALI IMEHIFADHIWA KWENYE KIFAA / HAIJATUMWA", packetCommands: "AMRI M MSAADA / L LUGHA / A ISHARA / H SAFARI / 0 MENYU",
  signalPreview: "MFANO WA ISHARA YA FAITHAI", signal: "ISHARA", priority: "KIPAUMBELE", statusSynthetic: "HALI NI MFANO / HAKUNA KILICHOTUMWA AU KUANZISHWA", signalCommands: "JIBU 1 MAELEZO / 2 INAYOFUATA / 8 ILIYOPITA / S HIFADHI / X NYAMAZISHA",
};

const ar = {
  ...en,
  brandInstitute: "معهد شلتنهام", ask: "ماذا لديك أو ماذا تحتاج اليوم؟", chooseLater: "اختر ما يناسبك. يمكنك تغييره لاحقاً.",
  resultStep: "خطوة واحدة مفيدة", resultHistory: "السجل المحلي", resultSignals: "صندوق الإشارات", resultPacket: "حزمة نصية", resultLanguage: "اللغة",
  text: "نص", visual: "مرئي", phoneView: "عرض الهاتف / النص", phoneAsk: "ماذا لديك أو تحتاج؟", replyMain: "أجب 0-5 / M مساعدة / L اللغة / A الإشارات / H الرحلة",
  path: "المسار", chooseFocus: "اختر هدفاً واحداً", selected: "تم الاختيار", next: "التالي", savedAs: "حُفظ باسم {id}. لم يُرسل شيء.", who: "لمن", how: "كيف",
  replyFocus: "أجب 1-{count} / S حفظ / D تم / E تصدير / I معلومات / 0 رجوع", noDirectory: "لا يوجد دليل أعضاء. لا يُرسل شيء دونك.",
  oneStep: "خطوة واحدة مفيدة", pressFocus: "اضغط 1-{count} لاختيار هدف.", saveFocused: "[S] احفظ الخطوة", savedReceipt: "[S] حُفظ {id}", exportPacket: "[E] حزمة نصية",
  moreInfo: "معلومات أكثر", lessInfo: "معلومات أقل", back: "رجوع", globalRoots: "عالمي وله جذور", globalRootsText: "مفتوح عالمياً ومتجذر في نموذج العدالة بقيادة السود في معهد شلتنهام. تُعطى الأولوية للحاجة ولا تُستخدم الهوية لتقليل الوصول.",
  loopHint: "اختر > ركز > احفظ > نفّذ. لا يغادر شيء هذا الجهاز.", historyLedger: "سجل النشاط المحلي", historySaved: "خطواتك المحفوظة", historyEmpty: "لا شيء محفوظ بعد.",
  historyIntro: "هذه قائمة خاصة في هذا المتصفح. ليست ملفاً شخصياً ولا منشوراً عاماً.", olderReceipts: "لا تزال هناك {count} إيصالات أقدم.", removeAll: "حذف كل بيانات FAITHAI المحفوظة في هذا المتصفح؟", remove: "حذف", keep: "احتفاظ", clearData: "مسح البيانات المحلية",
  completedStatus: "تم", savedStatus: "محفوظ", packetReady: "حزمة نصية للهاتف", packetIntro: "انسخ أو نزّل أو اقرأ هذا النص. FAITHAI لا يرسله عنك.", copy: "نسخ", download: "تنزيل .TXT", copied: "تم النسخ بأمرك. لم يُرسل شيء.", copyUnavailable: "النسخ غير متاح هنا. يبقى النص كاملاً ظاهراً.", downloaded: "تم التنزيل محلياً. لم يُرسل شيء.",
  signalsHeading: "إشارات الوصول إلى الذكاء الاصطناعي", signalsSub: "اختياري / حسب السياق / مشروح", saveFirst: "احفظ خطوة محددة أولاً.", signalHelp: "تستخدم الإشارات الخيارات المرقمة التي تحفظها على هذا الجهاز فقط.", backMenu: "العودة إلى القائمة", context: "السياق", localStep: "خطوة محلية", localSteps: "خطوات محلية",
  receiveSignals: "تلقي إشارات مرتبة من مدخلاتك المحفوظة؟", signalConsent: "يرتب هذا النموذج تذكيرات الوصول والدعم والخصوصية والموعد. لا يتصل بشركة هاتف.", turnOn: "تشغيل الإشارات", keepOff: "إبقاؤها متوقفة", muted: "الإشارات مكتومة.", mutedHelp: "لن تقاطعك أي إشارة. اضغط Y للاستئناف.", resume: "استئناف",
  synthetic: "معاينة اصطناعية / الذكاء يرتب / أنت تقرر", of: "من", contextScore: "درجة السياق", why: "لماذا وصلتك", aiUsed: "ماذا استخدم الذكاء", aiUsedText: "السجل المحلي فقط؛ لا جهات اتصال ولا دليل ولا أرشيف خاص ولا ملف خفي.", aiDidNot: "ماذا لم يفعل", aiDidNotText: "لم يتم تفعيل رسالة أو تعارف أو دفع أو كشف أو منشور عام.",
  details: "تفاصيل", less: "أقل", nextSignal: "التالي", previous: "السابق", save: "حفظ", saved: "محفوظ", mute: "كتم", signalSaved: "حُفظت الإشارة على هذا الجهاز. لم يُرسل رد.",
  storageError: "التخزين المحلي غير متاح. تعمل الواجهة لكن لا يمكن حفظ الإيصالات.", chooseBeforeSave: "اختر هدفاً مرقماً قبل الحفظ.", savedLocal: "حُفظ محلياً باسم {id}. لم يُرسل أو يُنشر.", chooseBeforePacket: "اختر هدفاً قبل إنشاء الحزمة.", reopened: "فُتح الإيصال المحلي {id}. لم يُرسل شيء.", saveBlocked: "منع المتصفح الحفظ. تبقى الخطوة ظاهرة ولم تُرسل.",
  footerPhone: "وضع الهاتف: أجب 0-5", footerHelp: "مساعدة", footerSignals: "إشارات", footerHistory: "السجل المحلي", footerScope: "عرض محدود / لا دليل / لا يُرسل شيء دونك", footerLanguage: "اللغة",
  languageTitle: "اختر لغتك", languageIntro: "حزم اللغة موجودة على هذا الجهاز. تغيير اللغة لا يرسل اختياراتك.", languageNote: "أوامر الأرقام تبقى نفسها بكل لغة.", asciiMode: "ASCII للهاتف", asciiOn: "تشغيل", asciiOff: "إيقاف", asciiUnavailable: "غير متاح لهذه الكتابة", current: "الحالية",
  journeyTitle: "رحلتك لمدة دقيقتين", stageChoose: "اختر", stageFocus: "ركز", stageSave: "احفظ", stageDo: "نفّذ", markDone: "[D] ضع علامة تم", checkpointComplete: "اكتملت الخطوة", completionMessage: "أنجزت خطوة مفيدة. لا نقاط ولا ترتيب: تقدمك ملكك.", startAnother: "ابدأ خطوة أخرى",
  progressSaved: "{saved} محفوظ", progressDone: "{done} تم", packetLocalStep: "خطوة FAITHAI محلية", receipt: "إيصال", focus: "هدف", statusNotSent: "الحالة محفوظة على هذا الجهاز / لم تُرسل", packetCommands: "الأوامر M مساعدة / L اللغة / A الإشارات / H الرحلة / 0 القائمة",
  signalPreview: "معاينة إشارة FAITHAI", signal: "إشارة", priority: "الأولوية", statusSynthetic: "حالة اصطناعية / لم يُرسل أو يُفعّل شيء", signalCommands: "أجب 1 تفاصيل / 2 التالي / 8 السابق / S حفظ / X كتم",
};

const pathTranslations = {
  es: {
    0: ["GUÍAME", "Empieza por la dirección que más se acerque a hoy.", "Cualquier persona que no sepa por dónde empezar.", "Puedes cambiar de dirección. Explorar nunca publica ni comparte nada.", [["QUIERO DAR", "Elige si puedes ofrecer tiempo, conocimiento, una herramienta o una presentación de confianza."], ["QUIERO CONSTRUIR", "Nombra el resultado y la versión más pequeña que puedas terminar en siete días."], ["QUIERO APRENDER", "Nombra una habilidad y una tarea real que demuestre el aprendizaje."], ["NECESITO APOYO", "Elige la barrera inmediata: seguridad, cuidado, comida, vivienda, trabajo, aprendizaje, recuperación o fondos."]]],
    1: ["TIEMPO O CUIDADO", "Elige una hora o un tipo de cuidado que puedas ofrecer o pedir esta semana.", "Personas cuidadoras, mayores, familias, vecindarios y organizadores.", "FAITHAI puede preparar una oferta o petición privada. Una persona revisa cualquier presentación.", [["OFRECER UNA HORA", "Escribe una oferta privada con la hora, la tarea y el área a la que puedes llegar."], ["PEDIR CUIDADO", "Nombra la tarea, el horario útil y lo que debe quedar privado."], ["CONTACTAR A ALGUIEN", "Elige una persona de confianza y prepara un mensaje sin presión."]]],
    2: ["HABILIDAD O CONOCIMIENTO", "Nombra algo que puedas enseñar o quieras aprender.", "Estudiantes, trabajadores, mayores, creadores y expertos locales.", "El conocimiento puede ser práctico, cultural, técnico, creativo o vivido.", [["ENSEÑAR ALGO", "Nombra una habilidad, un resultado y una primera lección de 20 minutos."], ["APRENDER ALGO", "Nombra una habilidad y la tarea real más pequeña que quieres completar."], ["CONSERVAR CONOCIMIENTO", "Registra una historia, método o lección en lenguaje claro antes de perderla."]]],
    3: ["HERRAMIENTAS O CRÉDITOS", "Nombra la herramienta, crédito de IA, dispositivo o acceso que bloquea tu trabajo.", "Personas con buenas ideas y menos recursos.", "Power Credits puede dirigir tokens, software, dispositivos o apoyo donados después de revisión humana.", [["TOKENS DE IA", "Nombra la tarea, el proveedor y la cantidad mínima de tokens que la desbloquea."], ["DISPOSITIVO O DATOS", "Nombra el dispositivo, conexión o límite de datos que bloquea la siguiente tarea."], ["SOFTWARE O HERRAMIENTA", "Nombra la herramienta y el resultado; revisa primero una opción gratuita o local."]]],
    4: ["PROYECTO O IDEA", "Describe en una frase el resultado que quieres.", "Fundadores, artistas, organizadores, estudiantes y equipos pequeños.", "FAITHAI puede convertir la frase en una acción sin publicar ni apropiarse de tu idea.", [["HACER UN PLAN", "Escribe el resultado, a quién ayuda y la versión que puedes terminar en siete días."], ["ENCONTRAR AYUDA", "Nombra un rol faltante y una tarea limitada para conversar con alguien de confianza."], ["ENCONTRAR RECURSOS", "Nombra el único recurso que hace que el proyecto pase de bloqueado a comprobable."]]],
    5: ["NECESITO APOYO", "Elige el apoyo que más necesitas ahora.", "Personas ante una barrera urgente, especialmente con menos acceso.", "La necesidad va antes que la popularidad. Una persona confirma contactos, fondos y presentaciones sensibles.", [["SEGURIDAD O CUIDADO", "Elige una persona o servicio revisado y comparte solo lo necesario para el siguiente paso seguro."], ["COMIDA O VIVIENDA", "Nombra la necesidad, el área general y el plazo sin crear un perfil público."], ["TRABAJO O APRENDIZAJE", "Nombra un rol o habilidad y la oportunidad más pequeña que te haría avanzar."], ["RECUPERACIÓN", "Elige una tarea estabilizadora para hoy y una persona que pueda acompañar el plan."], ["FONDOS", "Nombra el propósito, la cantidad mínima, el plazo y quién debe revisar cualquier movimiento de dinero."]]],
  },
  fr: {
    0: ["GUIDEZ-MOI", "Commencez par la direction la plus proche de votre besoin.", "Toute personne qui ne sait pas par où commencer.", "Vous pouvez changer de direction. Explorer ne publie et ne partage rien.", [["JE VEUX DONNER", "Choisissez si vous pouvez offrir du temps, un savoir, un outil ou une présentation de confiance."], ["JE VEUX CONSTRUIRE", "Nommez le résultat et la plus petite version réalisable en sept jours."], ["JE VEUX APPRENDRE", "Nommez une compétence et une tâche réelle qui prouvera l'apprentissage."], ["J'AI BESOIN D'AIDE", "Choisissez l'obstacle immédiat : sécurité, soins, nourriture, logement, travail, apprentissage, rétablissement ou fonds."]]],
    1: ["TEMPS OU SOINS", "Choisissez une heure ou un type de soin à offrir ou demander cette semaine.", "Aidants, aînés, familles, voisins et organisateurs.", "FAITHAI peut préparer une offre ou demande privée. Toute présentation est vérifiée par une personne.", [["OFFRIR UNE HEURE", "Écrivez une offre privée avec l'heure, la tâche et la zone accessible."], ["DEMANDER DES SOINS", "Nommez la tâche, la période utile et ce qui doit rester privé."], ["PRENDRE DES NOUVELLES", "Choisissez une personne de confiance et préparez un message sans pression."]]],
    2: ["COMPÉTENCE OU SAVOIR", "Nommez une chose à enseigner ou à apprendre.", "Apprenants, travailleurs, aînés, créateurs et experts locaux.", "Le savoir peut être pratique, culturel, technique, créatif ou vécu.", [["ENSEIGNER", "Nommez une compétence, un résultat et une première leçon de 20 minutes."], ["APPRENDRE", "Nommez une compétence et la plus petite tâche réelle à accomplir."], ["PRÉSERVER UN SAVOIR", "Enregistrez une histoire, méthode ou leçon en langage clair avant qu'elle ne se perde."]]],
    3: ["OUTILS OU CRÉDITS", "Nommez l'outil, le crédit IA, l'appareil ou l'accès qui bloque votre travail.", "Personnes avec de bonnes idées et moins de ressources.", "Power Credits peut orienter des jetons, logiciels, appareils ou aides donnés après examen humain.", [["JETONS IA", "Nommez la tâche, le fournisseur et le minimum de jetons nécessaire."], ["APPAREIL OU DONNÉES", "Nommez l'appareil, la connexion ou la limite de données qui bloque la prochaine tâche."], ["LOGICIEL OU OUTIL", "Nommez l'outil et le résultat; vérifiez d'abord une option gratuite ou locale."]]],
    4: ["PROJET OU IDÉE", "Décrivez le résultat voulu en une phrase.", "Fondateurs, artistes, organisateurs, étudiants et petites équipes.", "FAITHAI peut transformer la phrase en action sans publier ni revendiquer votre idée.", [["FAIRE UN PLAN", "Écrivez le résultat, la personne aidée et la version réalisable en sept jours."], ["TROUVER DE L'AIDE", "Nommez un rôle manquant et une tâche limitée à proposer à une personne de confiance."], ["TROUVER DES RESSOURCES", "Nommez la ressource qui rend le projet testable."]]],
    5: ["J'AI BESOIN D'AIDE", "Choisissez le soutien le plus nécessaire maintenant.", "Personnes face à un obstacle urgent, surtout avec le moins d'accès.", "Le besoin passe avant la popularité. Une personne confirme les contacts, fonds et présentations sensibles.", [["SÉCURITÉ OU SOINS", "Choisissez une personne ou un service vérifié et ne partagez que le nécessaire."], ["NOURRITURE OU LOGEMENT", "Nommez le besoin, la zone générale et le délai sans créer de profil public."], ["TRAVAIL OU APPRENTISSAGE", "Nommez un rôle ou une compétence et la plus petite occasion utile."], ["RÉTABLISSEMENT", "Choisissez une tâche stabilisante aujourd'hui et une personne de confiance pour accompagner le plan."], ["FONDS", "Nommez le but, le minimum, le délai et la personne qui doit vérifier tout mouvement d'argent."]]],
  },
  sw: {
    0: ["NIONGOZE", "Anza na mwelekeo unaokaribia hitaji lako leo.", "Mtu yeyote asiyejua pa kuanzia.", "Unaweza kubadilisha njia. Kuchunguza hakuchapishi wala kutuma chochote.", [["NATAKA KUTOA", "Chagua kutoa muda, maarifa, chombo, au utambulisho wa kuaminika."], ["NATAKA KUJENGA", "Taja matokeo na toleo dogo unaloweza kumaliza kwa siku saba."], ["NATAKA KUJIFUNZA", "Taja ujuzi na kazi halisi itakayothibitisha umejifunza."], ["NAHITAJI MSAADA", "Chagua kizuizi cha sasa: usalama, huduma, chakula, makazi, kazi, kujifunza, kupona, au fedha."]]],
    1: ["MUDA AU HUDUMA", "Chagua saa moja au huduma unayoweza kutoa au kuomba wiki hii.", "Walezi, wazee, familia, majirani na waandaaji.", "FAITHAI inaweza kuandaa ombi la binafsi. Mtu hukagua utambulisho wowote.", [["TOA SAA MOJA", "Andika ofa fupi ya binafsi yenye saa, kazi na eneo unaloweza kufikia."], ["OMBA HUDUMA", "Taja kazi, muda unaofaa na kinachopaswa kubaki binafsi."], ["MUULIZE MTU HALI", "Chagua mtu wa kuaminika na andaa ujumbe usio na shinikizo."]]],
    2: ["UJUZI AU MAARIFA", "Taja jambo moja unaloweza kufundisha au kujifunza.", "Wanafunzi, wafanyakazi, wazee, wabunifu na wataalamu wa eneo.", "Maarifa yanaweza kuwa ya vitendo, kitamaduni, kiufundi, kibunifu au ya maisha.", [["FUNDISHA", "Taja ujuzi, matokeo na somo la kwanza la dakika 20."], ["JIFUNZE", "Taja ujuzi na kazi ndogo halisi unayotaka kukamilisha."], ["HIFADHI MAARIFA", "Rekodi hadithi, mbinu au somo kwa lugha rahisi kabla halijapotea."]]],
    3: ["ZANA AU MIKOPO", "Taja zana, mkopo wa AI, kifaa au pengo la upatikanaji linalozuia kazi.", "Wajenzi wenye mawazo mazuri na rasilimali chache.", "Power Credits inaweza kuelekeza tokeni, programu, vifaa au msaada uliotolewa baada ya ukaguzi wa mtu.", [["TOKENI ZA AI", "Taja kazi ya AI, mtoa huduma na tokeni chache zinazohitajika."], ["KIFAA AU DATA", "Taja kifaa, muunganisho au kikomo cha data kinachozuia kazi inayofuata."], ["PROGRAMU AU ZANA", "Taja zana na matokeo; angalia kwanza chaguo la bure au la kifaa."]]],
    4: ["MRADI AU WAZO", "Eleza matokeo unayotaka kwa sentensi moja.", "Waanzilishi, wasanii, waandaaji, wanafunzi na timu ndogo.", "FAITHAI inaweza kugeuza sentensi kuwa hatua bila kuchapisha au kuchukua wazo lako.", [["TENGENEZA MPANGO", "Andika matokeo, anayesaidiwa na toleo dogo la kumaliza kwa siku saba."], ["TAFUTA MSAIDIZI", "Taja jukumu linalokosekana na kazi maalum ya kujadili na mtu wa kuaminika."], ["TAFUTA RASILIMALI", "Taja rasilimali moja itakayofanya mradi uweze kujaribiwa."]]],
    5: ["NAHITAJI MSAADA", "Chagua msaada unaohitaji zaidi sasa.", "Watu wenye kizuizi cha haraka, hasa wenye upatikanaji mdogo.", "Uhitaji huja kabla ya umaarufu. Mtu huthibitisha mawasiliano, fedha na utambulisho nyeti.", [["USALAMA AU HUDUMA", "Chagua mtu au huduma iliyokaguliwa na shiriki tu kinachohitajika kwa hatua salama."], ["CHAKULA AU MAKAZI", "Taja hitaji, eneo la jumla na muda bila kutengeneza wasifu wa umma."], ["KAZI AU KUJIFUNZA", "Taja jukumu au ujuzi na nafasi ndogo itakayokusogeza mbele."], ["KUPONA", "Chagua kazi moja ya kukutuliza leo na mtu wa kuaminika wa kushuhudia mpango."], ["FEDHA", "Taja kusudi, kiasi cha chini, muda na nani lazima akague uhamisho wa fedha."]]],
  },
  ar: {
    0: ["أرشدني", "ابدأ بالاتجاه الأقرب إلى حاجتك اليوم.", "أي شخص لا يعرف من أين يبدأ.", "يمكنك تغيير الاتجاه. الاستكشاف لا ينشر أو يرسل شيئاً.", [["أريد أن أعطي", "اختر تقديم الوقت أو المعرفة أو أداة أو تعريفاً موثوقاً."], ["أريد أن أبني", "حدد النتيجة وأصغر نسخة تنجزها خلال سبعة أيام."], ["أريد أن أتعلم", "حدد مهارة ومهمة حقيقية تثبت التعلم."], ["أحتاج إلى دعم", "اختر العائق الفوري: الأمان أو الرعاية أو الطعام أو السكن أو العمل أو التعلم أو التعافي أو المال."]]],
    1: ["الوقت أو الرعاية", "اختر ساعة أو نوع رعاية يمكنك تقديمه أو طلبه هذا الأسبوع.", "مقدمو الرعاية وكبار السن والعائلات والجيران والمنظمون.", "يمكن لـ FAITHAI إعداد عرض أو طلب خاص. يراجع شخص أي تعارف.", [["قدم ساعة", "اكتب عرضاً خاصاً قصيراً يحدد الساعة والمهمة والمنطقة."], ["اطلب رعاية", "حدد مهمة الرعاية والوقت المناسب وما يجب أن يبقى خاصاً."], ["اطمئن على شخص", "اختر شخصاً موثوقاً وجهز رسالة بلا ضغط."]]],
    2: ["مهارة أو معرفة", "حدد شيئاً يمكنك تعليمه أو تريد تعلمه.", "المتعلمون والعاملون وكبار السن والمبدعون والخبراء المحليون.", "قد تكون المعرفة عملية أو ثقافية أو تقنية أو إبداعية أو من تجربة الحياة.", [["علّم شيئاً", "حدد مهارة ونتيجة ودرساً أول مدته 20 دقيقة."], ["تعلم شيئاً", "حدد مهارة وأصغر مهمة حقيقية تريد إنجازها."], ["احفظ المعرفة", "سجل قصة أو طريقة أو درساً بلغة واضحة قبل أن يضيع."]]],
    3: ["أدوات أو أرصدة", "حدد الأداة أو رصيد الذكاء أو الجهاز أو فجوة الوصول التي تعطل عملك.", "أشخاص لديهم أفكار قوية وموارد أقل.", "يمكن لـ Power Credits توجيه رموز أو برامج أو أجهزة أو دعم متبرع به بعد مراجعة بشرية.", [["رموز الذكاء", "حدد المهمة والمزود وأقل عدد من الرموز اللازمة."], ["جهاز أو بيانات", "حدد الجهاز أو الاتصال أو حد البيانات الذي يعطل المهمة التالية."], ["برنامج أو أداة", "حدد الأداة والنتيجة وابحث أولاً عن خيار مجاني أو محلي."]]],
    4: ["مشروع أو فكرة", "صف النتيجة التي تريدها في جملة واحدة.", "المؤسسون والفنانون والمنظمون والطلاب والفرق الصغيرة.", "يمكن لـ FAITHAI تحويل الجملة إلى خطوة دون نشر فكرتك أو ادعاء ملكيتها.", [["ضع خطة", "اكتب النتيجة ومن تساعده وأصغر نسخة تنجزها خلال سبعة أيام."], ["ابحث عن مساعد", "حدد دوراً مفقوداً ومهمة محددة لمناقشتها مع شخص موثوق."], ["ابحث عن موارد", "حدد مورداً واحداً يجعل المشروع قابلاً للاختبار."]]],
    5: ["أحتاج إلى دعم", "اختر الدعم الذي تحتاجه أكثر الآن.", "أشخاص يواجهون عائقاً عاجلاً، خاصة من لديهم وصول أقل.", "تأتي الحاجة قبل الشعبية. يؤكد شخص المطابقات والتمويل والتعارف الحساس.", [["الأمان أو الرعاية", "اختر شخصاً أو خدمة موثوقة وشارك فقط ما يلزم للخطوة الآمنة التالية."], ["الطعام أو السكن", "حدد الحاجة والمنطقة العامة والموعد دون إنشاء ملف عام."], ["العمل أو التعلم", "حدد دوراً أو مهارة وأصغر فرصة تحركك للأمام."], ["التعافي", "اختر مهمة تثبيت واحدة اليوم وشخصاً موثوقاً يشهد الخطة."], ["المال", "حدد الغرض وأقل مبلغ والموعد ومن يجب أن يراجع أي حركة مالية."]]],
  },
};

const signalKinds = {
  en: {
    deadline: ["TIME", "Add a useful time or deadline.", "Time-sensitive steps are easier to act on when the window is clear.", "Record when this step is needed and what can wait."],
    privacy: ["PRIVACY", "Set what may be shared.", "Sensitive context should never spread beyond the next approved step.", "Choose who may see this and what stays private."],
    access: ["ACCESS", "Prepare a clear access request.", "A small, specific request is easier for a human to review and match.", "Name the minimum resource and useful deadline."],
    credit: ["CREDIT", "Protect knowledge credit.", "Community knowledge should not become unattributed extraction.", "Record the teacher, source, and allowed reuse."],
    offline: ["LOW-BANDWIDTH", "Check a free or offline option.", "A local tool may work without recurring cost or connectivity.", "Compare one free or offline option first."],
    ownership: ["OWNERSHIP", "Protect the project's ownership boundary.", "Clear authorship reduces extraction when others join.", "Record who owns the idea and the bounded help requested."],
    progress: ["NEXT STEP", "Shrink this to one visible action.", "A small proof creates evidence without needing a large team or budget.", "Choose one person, one result, and one test."],
    support: ["SUPPORT FIRST", "Review the immediate support step first.", "Support and safety rank ahead of promotion and popularity.", "Choose one trusted person or reviewed service for the next step."],
  },
  es: {
    deadline: ["TIEMPO", "Añade una hora o fecha útil.", "Los pasos urgentes son más fáciles con un plazo claro.", "Anota cuándo se necesita y qué puede esperar."],
    privacy: ["PRIVACIDAD", "Decide qué se puede compartir.", "El contexto sensible no debe pasar del siguiente paso aprobado.", "Elige quién puede verlo y qué queda privado."],
    access: ["ACCESO", "Prepara una petición clara de acceso.", "Una petición pequeña y concreta es más fácil de revisar.", "Nombra el recurso mínimo y el plazo útil."],
    credit: ["CRÉDITO", "Protege el crédito del conocimiento.", "El saber comunitario no debe convertirse en extracción sin atribución.", "Registra quién enseñó, la fuente y el uso permitido."],
    offline: ["POCOS DATOS", "Revisa una opción gratuita o sin conexión.", "Una herramienta local puede funcionar sin coste continuo.", "Compara primero una opción gratuita o local."],
    ownership: ["PROPIEDAD", "Protege la propiedad del proyecto.", "La autoría clara reduce la extracción.", "Registra quién posee la idea y la ayuda limitada solicitada."],
    progress: ["PRÓXIMO PASO", "Reduce esto a una acción visible.", "Una prueba pequeña crea evidencia con pocos recursos.", "Elige una persona, un resultado y una prueba."],
    support: ["APOYO PRIMERO", "Revisa primero el apoyo inmediato.", "El apoyo y la seguridad van antes que la promoción.", "Elige una persona de confianza o un servicio revisado."],
  },
  fr: {
    deadline: ["DÉLAI", "Ajoutez une heure ou une date utile.", "Une fenêtre claire rend l'action urgente plus facile.", "Notez quand cette étape est nécessaire."],
    privacy: ["CONFIDENTIALITÉ", "Décidez ce qui peut être partagé.", "Le contexte sensible ne doit pas dépasser l'étape approuvée.", "Choisissez qui peut voir quoi et ce qui reste privé."],
    access: ["ACCÈS", "Préparez une demande d'accès claire.", "Une petite demande précise est plus facile à vérifier.", "Nommez le minimum nécessaire et le délai."],
    credit: ["CRÉDIT", "Protégez le crédit du savoir.", "Le savoir communautaire ne doit pas être extrait sans attribution.", "Notez l'enseignant, la source et la réutilisation permise."],
    offline: ["BAS DÉBIT", "Vérifiez une option gratuite ou hors ligne.", "Un outil local peut fonctionner sans coût continu.", "Comparez d'abord une option gratuite ou locale."],
    ownership: ["PROPRIÉTÉ", "Protégez la propriété du projet.", "Une paternité claire réduit l'extraction.", "Notez qui possède l'idée et l'aide limitée demandée."],
    progress: ["PROCHAINE ÉTAPE", "Réduisez ceci à une action visible.", "Une petite preuve crée des résultats avec peu de ressources.", "Choisissez une personne, un résultat et un test."],
    support: ["AIDE D'ABORD", "Examinez d'abord l'aide immédiate.", "Le soutien et la sécurité passent avant la promotion.", "Choisissez une personne de confiance ou un service vérifié."],
  },
  sw: {
    deadline: ["MUDA", "Ongeza muda au tarehe muhimu.", "Hatua ya haraka ni rahisi ikijulikana muda wake.", "Andika hatua inahitajika lini na nini kinaweza kusubiri."],
    privacy: ["FARAGHA", "Amua kinachoweza kushirikishwa.", "Taarifa nyeti zisipite hatua uliyoidhinisha.", "Chagua nani anaweza kuona nini na kinachobaki binafsi."],
    access: ["UPATIKANAJI", "Andaa ombi wazi la upatikanaji.", "Ombi dogo maalum ni rahisi kukaguliwa.", "Taja rasilimali ya chini na muda muhimu."],
    credit: ["SIFA", "Linda sifa ya maarifa.", "Maarifa ya jamii yasichukuliwe bila kutaja chanzo.", "Andika mwalimu, chanzo na matumizi yanayoruhusiwa."],
    offline: ["DATA CHACHE", "Angalia chaguo la bure au lisilo mtandaoni.", "Zana ya kifaa inaweza kufanya kazi bila gharama ya kudumu.", "Linganisha kwanza chaguo la bure au la kifaa."],
    ownership: ["UMILIKI", "Linda mpaka wa umiliki wa mradi.", "Uandishi wazi hupunguza unyonyaji.", "Andika mwenye wazo na msaada maalum unaoombwa."],
    progress: ["HATUA INAYOFUATA", "Punguza hii iwe tendo moja linaloonekana.", "Jaribio dogo huleta ushahidi bila timu kubwa.", "Chagua mtu mmoja, matokeo moja na jaribio moja."],
    support: ["MSAADA KWANZA", "Kagua kwanza hatua ya msaada wa haraka.", "Msaada na usalama huja kabla ya umaarufu.", "Chagua mtu wa kuaminika au huduma iliyokaguliwa."],
  },
  ar: {
    deadline: ["الوقت", "أضف وقتاً أو موعداً مفيداً.", "تكون الخطوات العاجلة أسهل عندما يكون الوقت واضحاً.", "سجل متى تحتاج هذه الخطوة وما يمكن أن ينتظر."],
    privacy: ["الخصوصية", "حدد ما يمكن مشاركته.", "يجب ألا يتجاوز السياق الحساس الخطوة التي وافقت عليها.", "اختر من يرى ماذا وما يبقى خاصاً."],
    access: ["الوصول", "جهز طلب وصول واضحاً.", "الطلب الصغير المحدد أسهل للمراجعة.", "حدد أقل مورد تحتاجه والموعد."],
    credit: ["النسبة", "احمِ نسبة المعرفة إلى أصحابها.", "يجب ألا تصبح معرفة المجتمع استخراجاً بلا ذكر المصدر.", "سجل المعلم والمصدر وإعادة الاستخدام المسموح."],
    offline: ["بيانات قليلة", "تحقق من خيار مجاني أو دون اتصال.", "قد تعمل أداة محلية بلا تكلفة مستمرة.", "قارن أولاً خياراً مجانياً أو محلياً."],
    ownership: ["الملكية", "احمِ حدود ملكية المشروع.", "وضوح التأليف يقلل الاستغلال.", "سجل صاحب الفكرة والمساعدة المحددة المطلوبة."],
    progress: ["الخطوة التالية", "صغّر هذا إلى فعل واحد ظاهر.", "الاختبار الصغير يصنع دليلاً بلا فريق كبير.", "اختر شخصاً ونتيجة واختباراً واحداً."],
    support: ["الدعم أولاً", "راجع خطوة الدعم الفورية أولاً.", "الدعم والأمان قبل الترويج والشعبية.", "اختر شخصاً موثوقاً أو خدمة مراجعة."],
  },
};

const uiByLanguage = { en, es, fr, sw, ar };

function interpolate(value, variables) {
  return Object.entries(variables).reduce((text, [key, replacement]) => text.replaceAll(`{${key}}`, String(replacement)), value);
}

export function translate(locale, key, variables = {}) {
  return interpolate(uiByLanguage[locale]?.[key] ?? en[key] ?? key, variables);
}

export function getLanguage(locale) {
  return LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[0];
}

export function getLocalizedOptions(locale) {
  if (locale === "en" || !pathTranslations[locale]) return OPTIONS;
  return OPTIONS.map((option) => {
    const translation = pathTranslations[locale][option.id];
    if (!translation) return option;
    const [label, step, people, detail, choices] = translation;
    return {
      ...option,
      label,
      step,
      people,
      detail,
      choices: option.choices.map((choice, index) => ({ ...choice, label: choices[index][0], action: choices[index][1] })),
    };
  });
}

export function localizeSignal(signal, locale, options) {
  if (!signal) return signal;
  const option = options.find((item) => item.id === signal.contextOption);
  const choice = option?.choices.find((item) => item.id === signal.contextChoice);
  if (locale === "en") {
    return {
      ...signal,
      reason: `${translate(locale, "path")} ${signal.contextOption}.${signal.contextChoice}: ${choice?.label ?? ""}.`,
    };
  }
  const copy = signalKinds[locale]?.[signal.kind] ?? signalKinds.en[signal.kind] ?? signalKinds.en.progress;
  return {
    ...signal,
    priority: copy[0],
    title: copy[1],
    importance: copy[2],
    action: copy[3],
    reason: `${translate(locale, "path")} ${signal.contextOption}.${signal.contextChoice}: ${choice?.label ?? ""}.`,
  };
}

export function getPacketLabels(locale) {
  const t = (key, variables) => translate(locale, key, variables);
  return {
    localStep: t("packetLocalStep"), receipt: t("receipt"), path: t("path"), focus: t("focus"), next: t("next"),
    status: t("statusNotSent"), commands: t("packetCommands"), signalPreview: t("signalPreview"), signal: t("signal"),
    of: t("of"), priority: t("priority"), why: t("why"), syntheticStatus: t("statusSynthetic"), signalCommands: t("signalCommands"),
  };
}

export function toPhoneSafe(text, locale, asciiSafe) {
  if (!asciiSafe || locale === "ar") return text;
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/→/g, ">")
    .replace(/¿|¡/g, "");
}

export function translationCoverage() {
  const requiredUiKeys = Object.keys(en);
  const optionCounts = Object.fromEntries(OPTIONS.map((option) => [option.id, option.choices.length]));
  return LANGUAGES.map((language) => ({
    code: language.code,
    missingUi: requiredUiKeys.filter((key) => !(key in uiByLanguage[language.code])),
    missingPaths: language.code === "en" ? [] : OPTIONS.filter((option) => !pathTranslations[language.code]?.[option.id]).map((option) => option.id),
    invalidChoices: language.code === "en" ? [] : OPTIONS.filter((option) => pathTranslations[language.code]?.[option.id]?.[4]?.length !== optionCounts[option.id]).map((option) => option.id),
  }));
}
