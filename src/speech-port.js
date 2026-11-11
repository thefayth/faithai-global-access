const DISCLOSURE = "Your browser may use an external speech service. FAITHAI does not store audio; the editable transcript stays in this session until you submit it.";

export class BrowserSpeechPort {
  constructor(scope = globalThis, timeoutMs = 15000) {
    this.scope = scope;
    this.Recognition = scope.SpeechRecognition || scope.webkitSpeechRecognition || null;
    this.timeoutMs = timeoutMs;
    this.recognition = null;
    this.timer = null;
    this.listening = false;
    this.transcript = "";
    this.error = null;
  }

  get supported() {
    return Boolean(this.Recognition);
  }

  requestConsent() {
    return { required: true, disclosure: DISCLOSURE };
  }

  start({ locale = "en-US", onInterim = () => {}, onFinal = () => {}, onError = () => {}, onState = () => {} } = {}) {
    if (!this.supported) {
      this.error = "unsupported";
      onError(this.error);
      return false;
    }
    this.cancel();
    const recognition = new this.Recognition();
    this.recognition = recognition;
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => { this.listening = true; this.error = null; onState({ listening: true }); };
    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
        const value = event.results[index]?.[0]?.transcript || "";
        if (event.results[index].isFinal) final += value; else interim += value;
      }
      if (interim) { this.transcript = interim; onInterim(interim); }
      if (final) { this.transcript = final; onFinal(final); }
    };
    recognition.onerror = (event) => { this.error = event.error || "recognition-error"; this.listening = false; this.clearTimer(); onError(this.error); onState({ listening: false }); };
    recognition.onend = () => { this.listening = false; this.clearTimer(); onState({ listening: false }); };
    recognition.start();
    this.timer = this.scope.setTimeout?.(() => this.cancel("timeout"), this.timeoutMs) || null;
    return true;
  }

  clearTimer() {
    if (this.timer && this.scope.clearTimeout) this.scope.clearTimeout(this.timer);
    this.timer = null;
  }

  cancel(reason = "cancelled") {
    this.clearTimer();
    if (this.recognition) {
      const active = this.recognition;
      this.recognition = null;
      try { active.abort(); } catch { /* The browser may already have ended recognition. */ }
    }
    this.listening = false;
    if (reason === "timeout") this.error = reason;
  }
}

export function createSpeechPort(scope = globalThis, timeoutMs = 15000) {
  return new BrowserSpeechPort(scope, timeoutMs);
}
