// Small synthesized chimes for message events. Generated with oscillators
// rather than shipped as audio files — keeps the bundle tiny and avoids
// needing to source/license sound assets for a "soft bloom" sound that's
// easy to just build.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  audioCtx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  peakGain: number,
) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

const SOUND_PREF_KEY = "sound_enabled";

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_PREF_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_PREF_KEY, enabled ? "1" : "0");
  } catch {
    // ignore — sound preference just won't persist this session
  }
}

export function playSentChime() {
  if (!isSoundEnabled()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  tone(audioCtx, 740, now, 0.18, 0.055); // F#5
  tone(audioCtx, 988, now + 0.05, 0.22, 0.045); // B5
}

export function playReceivedChime() {
  if (!isSoundEnabled()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  tone(audioCtx, 523, now, 0.16, 0.05); // C5
  tone(audioCtx, 659, now + 0.04, 0.2, 0.04); // E5
}

export function playSurpriseChime() {
  if (!isSoundEnabled()) return;
  const audioCtx = getContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  [523, 659, 784, 988].forEach((freq, i) => tone(audioCtx, freq, now + i * 0.09, 0.35, 0.045));
}
