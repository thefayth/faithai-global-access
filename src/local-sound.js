export function createLocalSound(scope = globalThis) {
  let enabled = false;
  let context = null;

  return {
    get enabled() { return enabled; },
    setEnabled(next) { enabled = Boolean(next); return enabled; },
    play(kind = "move") {
      if (!enabled) return false;
      const AudioContext = scope.AudioContext || scope.webkitAudioContext;
      if (!AudioContext) return false;
      context ||= new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const frequencies = { move: 220, confirm: 330, save: 520, back: 165 };
      const start = context.currentTime;
      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(frequencies[kind] || frequencies.move, start);
      gain.gain.setValueAtTime(0.025, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.075);
      return true;
    },
  };
}
