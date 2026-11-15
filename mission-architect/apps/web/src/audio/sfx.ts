/** Sound effects: recorded files (in /public/assets/audio) plus synthesized UI sounds. */
export type Sfx = "success" | "lose" | "level_up" | "click" | "market" | "missions" | "mission";

const FILES: Partial<Record<Sfx, string>> = {
  success: "/assets/audio/success.mp3",
  lose: "/assets/audio/lose.mp3",
  level_up: "/assets/audio/level_up.mp3",
  click: "/assets/audio/click.mp3",
};
const VOLUME: Partial<Record<Sfx, number>> = { success: 0.8, lose: 0.8, level_up: 0.8, click: 0.5 };

const cache: Partial<Record<Sfx, HTMLAudioElement>> = {};
let ctx: AudioContext | null = null;

/** Starts loading every recorded sound so it plays instantly later. */
export function preloadSfx(): void {
  if (typeof Audio === "undefined") return;
  (Object.keys(FILES) as Sfx[]).forEach((k) => {
    if (!cache[k] && FILES[k]) {
      const a = new Audio(FILES[k]);
      a.preload = "auto";
      cache[k] = a;
    }
  });
}

type Note = { f: number; at: number; dur: number; type: OscillatorType; gain: number };

/** Synthesized UI sounds, one distinct voice per kind of button. */
const SYNTH: Partial<Record<Sfx, Note[]>> = {
  // Market: bright two-ping coin sound
  market: [
    { f: 1319, at: 0, dur: 0.09, type: "square", gain: 0.12 },
    { f: 1976, at: 0.08, dur: 0.22, type: "square", gain: 0.12 },
  ],
  // Mission select / mission cards: soft, low, rounded blip
  missions: [
    { f: 262, at: 0, dur: 0.08, type: "triangle", gain: 0.3 },
    { f: 392, at: 0.07, dur: 0.16, type: "triangle", gain: 0.3 },
  ],
  // Start mission / launch buttons: rising three-note power-up
  mission: [
    { f: 392, at: 0, dur: 0.1, type: "sawtooth", gain: 0.1 },
    { f: 523, at: 0.09, dur: 0.1, type: "sawtooth", gain: 0.1 },
    { f: 784, at: 0.18, dur: 0.28, type: "sawtooth", gain: 0.1 },
  ],
};

function playSynth(name: Sfx): boolean {
  const notes = SYNTH[name];
  if (!notes) return false;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return true;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = n.type;
      osc.frequency.value = n.f;
      g.gain.setValueAtTime(0.0001, t0 + n.at);
      g.gain.exponentialRampToValueAtTime(n.gain, t0 + n.at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0 + n.at);
      osc.stop(t0 + n.at + n.dur + 0.02);
    }
  } catch {
    /* audio unavailable */
  }
  return true;
}

/** Plays a sound from the start; silently ignores blocked autoplay. */
export function playSfx(name: Sfx): void {
  if (typeof window === "undefined") return;
  (window as unknown as { __sfxLog?: string[] }).__sfxLog?.push(name); // test hook
  if (playSynth(name)) return;
  if (typeof Audio === "undefined") return;
  try {
    preloadSfx();
    const a = (cache[name] as HTMLAudioElement).cloneNode(true) as HTMLAudioElement;
    a.volume = VOLUME[name] ?? 0.6;
    void a.play().catch(() => {});
  } catch {
    /* audio unavailable */
  }
}

/** Picks the click sound for a pressed button from what it says. */
export function classifyClick(button: Element): Sfx {
  const text = ((button as HTMLElement).innerText || button.textContent || "").toLowerCase();
  if (/\b(market|buy|shop|store|purchase)\b/.test(text)) return "market";
  if (/start mission|launch|claim|re-engineer|debrief/.test(text)) return "mission";
  if (/mission|locked/.test(text)) return "missions";
  return "click";
}
