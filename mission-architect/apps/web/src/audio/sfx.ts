/** Sound effects (files live in /public/assets/audio). */
export type Sfx = "success" | "lose" | "level_up" | "click";

const FILES: Record<Sfx, string> = {
  success: "/assets/audio/success.mp3",
  lose: "/assets/audio/lose.mp3",
  level_up: "/assets/audio/level_up.mp3",
  click: "/assets/audio/click.mp3",
};
const VOLUME: Record<Sfx, number> = { success: 0.8, lose: 0.8, level_up: 0.8, click: 0.5 };

const cache: Partial<Record<Sfx, HTMLAudioElement>> = {};

/** Starts loading every sound so it plays instantly later. */
export function preloadSfx(): void {
  if (typeof Audio === "undefined") return;
  (Object.keys(FILES) as Sfx[]).forEach((k) => {
    if (!cache[k]) {
      const a = new Audio(FILES[k]);
      a.preload = "auto";
      cache[k] = a;
    }
  });
}

/** Plays a sound from the start; silently ignores blocked autoplay. */
export function playSfx(name: Sfx): void {
  if (typeof Audio === "undefined") return;
  try {
    preloadSfx();
    // clone so overlapping plays (rapid clicks) don't cut each other off
    const a = (cache[name] as HTMLAudioElement).cloneNode(true) as HTMLAudioElement;
    a.volume = VOLUME[name];
    void a.play().catch(() => {});
  } catch {
    /* audio unavailable */
  }
}
