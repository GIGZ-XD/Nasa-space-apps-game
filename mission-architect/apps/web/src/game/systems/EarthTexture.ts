import Phaser from "phaser";

/**
 * Procedurally paints a realistic Earth disc onto a canvas texture:
 * ocean depth gradient, noise-based continents with coastlines, ice caps,
 * soft clouds, sun-side lighting, a night side with city glow, limb darkening
 * and a thin atmospheric rim. The result is a perfect circle.
 */
/** Land/sea threshold of the noise field (lower = more land). */
const LAND = 0.495;

export function hash(ix: number, iy: number, seed: number): number {
  // 32-bit integer mixing (Math.imul keeps full precision)
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function fbm(x: number, y: number, seed: number, octaves = 5): number {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise(x * freq, y * freq, seed + i * 17);
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

export function createEarthTexture(scene: Phaser.Scene, key: string, diameter: number): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, diameter, diameter);
  if (!tex) return;
  const ctx = tex.getContext();
  const img = ctx.createImageData(diameter, diameter);
  const R = diameter / 2;
  const light = { x: -0.55, y: -0.5, z: 0.67 }; // sun from the upper left

  for (let py = 0; py < diameter; py++) {
    for (let px = 0; px < diameter; px++) {
      const nx = (px + 0.5 - R) / R;
      const ny = (py + 0.5 - R) / R;
      const r2 = nx * nx + ny * ny;
      const i = (py * diameter + px) * 4;
      if (r2 > 1) {
        img.data[i + 3] = 0;
        continue;
      }
      const nz = Math.sqrt(1 - r2);
      // Map the visible hemisphere to lon/lat-like coordinates (gentle spherical warp)
      const lon = Math.atan2(nx, nz);
      const lat = Math.asin(ny);
      const u = lon * 1.9 + 4.0;
      const v = lat * 2.4 + 2.0;

      // Land mask: large continents + coastal detail
      const land = fbm(u * 0.95, v * 0.95, 11) * 0.78 + fbm(u * 3.2, v * 3.2, 5) * 0.22;
      const isLand = land > LAND;

      let r: number, g: number, b: number;
      if (isLand) {
        const elev = (land - LAND) / (1 - LAND); // 0..1 inland
        const dry = fbm(u * 1.4 + 20, v * 1.4, 33);
        const latAbs = Math.abs(ny);
        // forest green -> savanna/desert tan -> mountain grey
        const gr = [34 + dry * 110, 88 + dry * 60, 40 + dry * 30];
        const mt = [110, 102, 92];
        const m = Math.min(1, Math.max(0, (elev - 0.55) * 2.2));
        r = gr[0] * (1 - m) + mt[0] * m;
        g = gr[1] * (1 - m) + mt[1] * m;
        b = gr[2] * (1 - m) + mt[2] * m;
        if (latAbs > 0.86) {
          const ice = Math.min(1, (latAbs - 0.86) / 0.1);
          r = r * (1 - ice) + 236 * ice;
          g = g * (1 - ice) + 242 * ice;
          b = b * (1 - ice) + 248 * ice;
        }
      } else {
        const depth = Math.min(1, (LAND - land) / 0.4);
        r = 26 - depth * 16;
        g = 92 - depth * 52;
        b = 170 - depth * 70;
        // shallow turquoise near the coast
        const shore = Math.max(0, 1 - (LAND - land) / 0.05);
        r += shore * 20;
        g += shore * 70;
        b += shore * 40;
        if (Math.abs(ny) > 0.9) {
          const ice = Math.min(1, (Math.abs(ny) - 0.9) / 0.07);
          r = r * (1 - ice) + 225 * ice;
          g = g * (1 - ice) + 236 * ice;
          b = b * (1 - ice) + 246 * ice;
        }
      }

      // Clouds
      const cloudN = fbm(u * 1.6 + 50, v * 2.4 + 9, 77) * 0.65 + fbm(u * 5, v * 5, 91) * 0.35;
      const cloud = Math.min(1, Math.max(0, (cloudN - 0.52) * 4.2)) * 0.88;
      r = r * (1 - cloud) + 250 * cloud;
      g = g * (1 - cloud) + 252 * cloud;
      b = b * (1 - cloud) + 255 * cloud;

      // Sun lighting (lambert) with a soft terminator and a dark, city-lit night side
      const lam = nx * light.x + ny * light.y + nz * light.z;
      const day = Math.min(1, Math.max(0, (lam + 0.08) / 0.5));
      const ambient = 0.1;
      const shade = ambient + (1 - ambient) * day;
      let rr = r * shade;
      let gg = g * shade;
      let bb = b * shade;
      if (day < 0.25 && isLand && cloud < 0.4) {
        const city = hash(Math.floor(px / 2), Math.floor(py / 2), 3) > 0.985 ? (0.25 - day) * 4 : 0;
        rr += 255 * city * 0.9;
        gg += 200 * city * 0.9;
        bb += 90 * city * 0.9;
      }
      // Ocean sun glint
      if (!isLand && cloud < 0.3) {
        const spec = Math.pow(Math.max(0, lam - 0.35) / 0.65, 40);
        rr += 110 * spec;
        gg += 120 * spec;
        bb += 140 * spec;
      }
      // Limb darkening + blue atmospheric rim
      const edge = Math.pow(1 - nz, 2.4);
      rr = rr * (1 - 0.35 * edge) + 90 * edge * 0.55 * (0.25 + day);
      gg = gg * (1 - 0.35 * edge) + 150 * edge * 0.55 * (0.25 + day);
      bb = bb * (1 - 0.25 * edge) + 255 * edge * 0.6 * (0.25 + day);

      img.data[i] = Math.min(255, rr);
      img.data[i + 1] = Math.min(255, gg);
      img.data[i + 2] = Math.min(255, bb);
      // anti-aliased circular edge
      const edgeDist = (1 - Math.sqrt(r2)) * R;
      img.data[i + 3] = Math.max(0, Math.min(255, edgeDist * 255));
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
}
