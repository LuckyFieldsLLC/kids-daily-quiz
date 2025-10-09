// Simple Web Speech API wrapper
// Provides: isSupported, speak(text, options), cancel(), toggle(text, options)
// Options allow specifying lang, rate, pitch.
export interface SpeakOptions {
  lang?: string;
  rate?: number; // 0.1 - 10 (spec). We'll clamp to 0.5 - 2 for safety.
  pitch?: number; // 0 - 2
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (e: SpeechSynthesisErrorEvent) => void;
}

const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

export function isSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const synth: any = (window as any).speechSynthesis;
  const Utter: any = (window as any).SpeechSynthesisUtterance;
  // synth should be object with speak/cancel functions, Utter should be constructible
  const synthOk = !!synth && typeof synth.speak === 'function' && typeof synth.cancel === 'function';
  const utterOk = typeof Utter === 'function';
  return synthOk && utterOk;
}

export function cancel() {
  if (!isSupported()) return;
  (window as any).speechSynthesis.cancel();
}

export function speak(text: string, opts: SpeakOptions = {}) {
  if (!isSupported()) return false;
  cancel(); // clear any existing queue
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts.lang || 'ja-JP';
  if (opts.rate) utter.rate = clamp(opts.rate, 0.5, 2);
  if (opts.pitch) utter.pitch = clamp(opts.pitch, 0, 2);
  if (opts.onStart) utter.onstart = opts.onStart;
  if (opts.onEnd) utter.onend = opts.onEnd as any; // assign end handler
  if (opts.onError) utter.onerror = opts.onError;
  window.speechSynthesis.speak(utter);
  return true;
}

export function isSpeaking() {
  if (!isSupported()) return false;
  return window.speechSynthesis.speaking;
}

export function toggle(text: string, opts: SpeakOptions = {}) {
  if (!isSupported()) return { started: false, supported: false };
  if (isSpeaking()) {
    cancel();
    return { started: false, supported: true };
  }
  const ok = speak(text, opts);
  return { started: ok, supported: true };
}

// Compose question + options if needed later
export function buildQuestionNarration(question: string, options?: string[]) {
  if (!options || options.length === 0) return question;
  const opts = options.map((o, i) => `選択肢${i + 1}: ${o}`).join('。');
  return `${question}。${opts}`;
}
