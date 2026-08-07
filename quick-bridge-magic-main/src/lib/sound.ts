let ctx: AudioContext | null = null;
let muted = false;
// Set to true the first time unlockAudio() is called from a user-gesture
// handler. Guards resume() calls in play() so we never attempt to start the
// AudioContext before the browser allows it — Chrome logs a console
// intervention warning for every premature resume() even when the rejection
// is silently caught.
let gestured = false;
export function setAudioMuted(v: boolean): void { muted = v; }

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockAudio(): void {
  gestured = true;
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

// Call when the session ends (or the user navigates away) so the AudioContext
// releases its OS audio focus and does not prevent mobile sleep/media lock.
export function suspendAudio(): void {
  if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
}

interface Tone {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

function play(tones: Tone[]): void {
  const c = getCtx();
  if (!c || muted) return;
  // Only resume if a user gesture has already occurred. Calling resume() before
  // any gesture triggers Chrome's AudioContext intervention warning in the
  // console even when the rejection is caught, causing noise on first load.
  if (gestured && c.state === "suspended") c.resume().catch(() => {});
  const now = c.currentTime;
  // Compute when the last tone finishes so we can auto-suspend the context
  // once the sounds are done.
  let maxEnd = now;
  for (const t of tones) {
    const osc = c.createOscillator();
    const g = c.createGain();
    const start = now + (t.delay ?? 0);
    const end = start + t.duration + 0.02;
    const peak = t.gain ?? 0.06;
    osc.type = t.type ?? "sine";
    osc.frequency.value = t.freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + t.duration);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(end);
    if (end > maxEnd) maxEnd = end;
  }
  // Suspend after all tones finish so we hold OS audio resources only while
  // actually playing. The context resumes automatically on the next play call.
  const delay = Math.ceil((maxEnd - now) * 1000) + 100;
  setTimeout(() => {
    if (ctx && ctx.state === "running") ctx.suspend().catch(() => {});
  }, delay);
}

export function playReceiveSound(): void {
  play([
    { freq: 880, duration: 0.09, gain: 0.07 },
    { freq: 1320, duration: 0.12, gain: 0.05, delay: 0.07 },
  ]);
}

export function playMessageSound(): void {
  play([{ freq: 660, duration: 0.08, gain: 0.05 }]);
}

export function playConnectSound(): void {
  play([
    { freq: 523.25, duration: 0.09, gain: 0.05 },
    { freq: 783.99, duration: 0.12, gain: 0.05, delay: 0.08 },
  ]);
}

export function playDisconnectSound(): void {
  play([
    { freq: 783.99, duration: 0.09, gain: 0.05 },
    { freq: 523.25, duration: 0.14, gain: 0.04, delay: 0.08 },
  ]);
}

// Descending counterpart to playReceiveSound: plays on the sender's side
// when a file transfer completes successfully. Two falling tones mirror the
// receiver's ascending pair so both sides hear a distinct "done" cue.
export function playSendSound(): void {
  play([
    { freq: 1046.5, duration: 0.09, gain: 0.06 },
    { freq: 783.99, duration: 0.12, gain: 0.05, delay: 0.07 },
  ]);
}
