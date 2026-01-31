/**
 * Simple sound effects and background music using Web Audio API (no external files).
 * @module audio
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  return audioContext;
}

// --- Background music (looping chiptune-style melody) ---

const BGM_VOLUME = 0.12;
const BPM = 118;
const BEAT_SEC = 60 / BPM;

/** Note (freq in Hz, duration in beats). */
const BGM_PATTERN: [number, number][] = [
  [330, 0.5], [392, 0.5], [523, 0.5], [392, 0.5], // E4 G4 C5 G4
  [330, 0.5], [392, 0.5], [523, 0.5], [392, 0.5],
  [262, 0.5], [330, 0.5], [392, 0.5], [330, 0.5], // C4 E4 G4 E4
  [349, 1], [392, 0.5], [392, 0.5],                 // F4 G4 G4
  [330, 0.5], [392, 0.5], [523, 0.5], [392, 0.5],
  [330, 0.5], [392, 0.5], [523, 0.5], [659, 0.5],  // ... E5
  [523, 1], [392, 1], [330, 1], [262, 1],          // C5 G4 E4 C4 (half notes)
];

let bgmGain: GainNode | null = null;
let bgmScheduledUntil = 0;
let bgmTimeoutId: ReturnType<typeof setTimeout> | null = null;

function scheduleBGMChunk(startTime: number): void {
  const ctx = getContext();
  if (!bgmGain) return;
  let t = startTime;
  for (const [freq, beats] of BGM_PATTERN) {
    const duration = beats * BEAT_SEC;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(bgmGain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(BGM_VOLUME * 0.35, t + 0.02);
    env.gain.setValueAtTime(BGM_VOLUME * 0.35, t + duration - 0.05);
    env.gain.linearRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
    t += duration;
  }
  bgmScheduledUntil = t;
}

function scheduleBGMLoop(): void {
  if (!bgmGain) return;
  const ctx = getContext();
  const now = ctx.currentTime;
  if (now >= bgmScheduledUntil) {
    scheduleBGMChunk(now);
  }
  bgmTimeoutId = setTimeout(
    scheduleBGMLoop,
    Math.max(100, (bgmScheduledUntil - now) * 1000 - 500),
  );
}

/** Start looping background music (e.g. when game starts). */
export function startBGM(): void {
  try {
    const ctx = getContext();
    if (bgmGain) return; // already running
    bgmGain = ctx.createGain();
    bgmGain.gain.value = BGM_VOLUME;
    bgmGain.connect(ctx.destination);
    bgmScheduledUntil = 0;
    scheduleBGMLoop();
  } catch {
    // Ignore
  }
}

/** Stop background music and clear scheduled notes. */
export function stopBGM(): void {
  if (bgmTimeoutId !== null) {
    clearTimeout(bgmTimeoutId);
    bgmTimeoutId = null;
  }
  if (bgmGain) {
    try {
      bgmGain.disconnect();
    } catch {
      // already disconnected
    }
    bgmGain = null;
  }
  bgmScheduledUntil = 0;
}

/** Mute/unmute BGM (e.g. when game is paused). */
export function setBGMVolume(volume: number): void {
  if (bgmGain) bgmGain.gain.setValueAtTime(Math.max(0, volume), getContext().currentTime);
}

/** Play a short tone for line clear. */
export function playLineClear(lines: number): void {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
    if (lines >= 2) {
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.connect(g2);
      g2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.14);
      g2.gain.setValueAtTime(0.1, ctx.currentTime + 0.06);
      g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc2.start(ctx.currentTime + 0.06);
      osc2.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Ignore if audio not allowed
  }
}

/** Optional: soft tick for hard drop. */
export function playHardDrop(): void {
  try {
    const ctx = getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch {
    // Ignore
  }
}
