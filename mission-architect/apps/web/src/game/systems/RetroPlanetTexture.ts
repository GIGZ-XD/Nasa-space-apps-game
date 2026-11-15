import Phaser from "phaser";
import { fbm, hash } from "./EarthTexture";

export type RetroPlanetKind = "moon" | "mars";

const hex = (c: string): [number, number, number] => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];

// Palettes run from brightest to darkest; every pixel snaps to one entry (retro look).
const PALETTES: Record<RetroPlanetKind, string[]> = {
  moon: ["#f4f2ea", "#d6d3c9", "#aeaba4", "#86847f", "#5d5b62", "#35333f", "#16141f"],
  mars: ["#f7c999", "#e49a5c", "#c56a35", "#9c4426", "#6b2a1b", "#3d170f", "#1a0b09"],
};

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/**
 * Paints a low-resolution, hard-edged pixel-art planet (no smoothing): a limited
 * palette, ordered dithering on the shaded side, craters (moon) or dust patches
 * and a polar cap (mars). Draw it scaled up with nearest-neighbour filtering.
 */
export function createRetroPlanetTexture(scene: Phaser.Scene, key: string, kind: RetroPlanetKind, px = 96): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, px, px);
  if (!tex) return;
  const ctx = tex.getContext();
  const img = ctx.createImageData(px, px);
  const pal = PALETTES[kind].map(hex);
  const R = px / 2;
  const light = { x: -0.5, y: -0.45, z: 0.74 };
  const seed = kind === "moon" ? 7 : 19;

  // Craters (moon) as seeded discs on the disc surface
  const craters: { x: number; y: number; r: number }[] = [];
  if (kind === "moon") {
    for (let i = 0; i < 26; i++) {
      const a = hash(i, 1, seed) * Math.PI * 2;
      const d = Math.sqrt(hash(i, 2, seed)) * 0.9;
      craters.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.045 + hash(i, 3, seed) * 0.11 });
    }
  }

  for (let py = 0; py < px; py++) {
    for (let pxl = 0; pxl < px; pxl++) {
      const nx = (pxl + 0.5 - R) / R;
      const ny = (py + 0.5 - R) / R;
      const r2 = nx * nx + ny * ny;
      const i = (py * px + pxl) * 4;
      if (r2 > 1) {
        img.data[i + 3] = 0; // hard, aliased edge: stays a crisp pixel circle
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      const u = nx * 3.2 + 10;
      const v = ny * 3.2 + 10;

      let albedo: number;
      if (kind === "moon") {
        albedo = 0.62 + (fbm(u, v, seed, 4) - 0.5) * 0.5;
        // dark maria (large smooth basins)
        const maria = fbm(u * 0.5 + 4, v * 0.5 + 9, seed + 40, 3);
        if (maria > 0.55) albedo -= (maria - 0.55) * 1.5;
        for (const c of craters) {
          const d = Math.hypot(nx - c.x, ny - c.y);
          if (d < c.r) albedo -= 0.2 * (1 - d / c.r) + 0.05; // dark floor
          else if (d < c.r + 0.03) albedo += 0.16; // bright rim
        }
      } else {
        albedo = 0.55 + (fbm(u, v, seed, 4) - 0.5) * 0.7;
        const dark = fbm(u * 0.7 + 30, v * 0.7, seed + 11, 3);
        if (dark > 0.52) albedo -= (dark - 0.52) * 1.3; // dark volcanic plains
        if (ny < -0.8) albedo = 1.1; // north polar ice cap
        if (ny > 0.88) albedo = Math.max(albedo, 0.95); // south cap
      }

      const lam = nx * light.x + ny * light.y + nz * light.z;
      const lit = Math.max(0, lam);
      let value = albedo * (0.15 + 0.95 * lit);
      // limb darkening
      value *= 0.75 + 0.25 * nz;
      // ordered dithering for the retro texture
      value += (BAYER[py % 4][pxl % 4] / 16 - 0.5) * 0.14;

      // value 1.0 -> palette[0], 0 -> darkest; snap to a palette index
      const idx = Math.max(0, Math.min(pal.length - 1, Math.round((1 - Math.min(1, Math.max(0, value))) * (pal.length - 1))));
      const [r, g, b] = pal[idx];
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}

/**
 * Pixel-art ground strip for landing scenes: a gently curved horizon with a
 * limited palette, ordered dithering, and craters (moon) or rocks (mars).
 * The surface is exactly CENTER_SURFACE_ROW pixels below the texture top at the
 * horizontal centre, so a lander can be placed precisely on it.
 */
export const GROUND_CENTER_ROW = 4;
export function createRetroGroundTexture(scene: Phaser.Scene, key: string, kind: RetroPlanetKind, w = 180, h = 56): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  const pal = PALETTES[kind].map(hex);
  const seed = kind === "moon" ? 31 : 47;

  const craters: { x: number; y: number; rx: number; ry: number }[] = [];
  const count = kind === "moon" ? 9 : 5;
  for (let i = 0; i < count; i++) {
    craters.push({ x: hash(i, 5, seed) * w, y: 10 + hash(i, 6, seed) * (h - 16), rx: 5 + hash(i, 7, seed) * 11, ry: 2 + hash(i, 8, seed) * 4 });
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / (w - 1)) * 2 - 1;
      const surface = GROUND_CENTER_ROW + 16 * nx * nx + (fbm(x * 0.09, 3, seed, 3) - 0.5) * 3;
      const i = (y * w + x) * 4;
      if (y < surface) {
        img.data[i + 3] = 0;
        continue;
      }
      const depth = (y - surface) / h;
      let value = 0.72 - depth * 0.45 + (fbm(x * 0.12, y * 0.2, seed + 3, 4) - 0.5) * 0.35;
      for (const c of craters) {
        const dx = (x - c.x) / c.rx;
        const dy = (y - c.y) / c.ry;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1) value -= 0.22 * (1 - d) + 0.04;
        else if (d < 1.18) value += 0.16;
      }
      if (kind === "mars") {
        // scattered rocks
        if (hash(x, y, seed + 9) > 0.992) value -= 0.35;
        if (hash(x, y, seed + 12) > 0.995) value += 0.3;
      }
      value += (BAYER[y % 4][x % 4] / 16 - 0.5) * 0.16;
      const idx = Math.max(0, Math.min(pal.length - 2, Math.round((1 - Math.min(1, Math.max(0, value))) * (pal.length - 2))));
      const [r, g, b] = pal[idx];
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}
