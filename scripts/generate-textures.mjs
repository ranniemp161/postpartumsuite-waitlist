// Generates the two paper texture tiles the design spec expects.
//
// `paper-tile.webp` and `felt-tile.webp` were never delivered with the design
// (see the open questions in blueprint/context/project-overview.md), so they are
// reconstructed here. Output is committed; this is a one-off tool, not part of
// `npm run build`.
//
//   node scripts/generate-textures.mjs
//
// Not feTurbulence, despite what the plan assumed. librsvg (what sharp renders
// SVG with) silently ignores `stitchTiles`, so a low-frequency turbulence tile
// comes out with a hard seam at the wrap: measured 8.8x the internal gradient,
// identical with and without the attribute. The fractal value noise below wraps
// by construction, because every octave's lattice index is taken modulo that
// octave's cell count.
//
// The tiles blend with `mix-blend-mode: soft-light`, which pivots on mid-grey:
// values above 128 lighten, below darken. Noise is therefore centred on 128 so
// the tile adds grain without shifting the paper colour underneath.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SIZE = 512;
const OUT_DIR = path.join(process.cwd(), "public", "textures");

const TILES = [
  {
    name: "paper-tile.webp",
    // Broad mottle down to fine grain: cartridge stock held up to the light.
    cells: [16, 16],
    octaves: 5,
    // Half-width of the grey band around 128. Wider reads as heavier stock.
    spread: 0.16,
    seed: 11,
    // Lossless. Broad mottle is exactly what webp's block transform smears, and
    // it does so hardest at the tile edge: q82 pushed the seam from 0.49 to
    // 1.37, q95 to 0.90. The wrap has to survive the encoder.
    encode: { lossless: true, effort: 6 },
  },
  {
    name: "felt-tile.webp",
    // Tight fibre with a slight cross-grain, hence the unequal cell counts.
    // Starting this fine matters: a coarser first octave reads as blotching on
    // the card rather than as stock fibre.
    cells: [112, 144],
    octaves: 3,
    spread: 0.1,
    seed: 23,
    // Lossy is safe here: grain this fine leaves nothing for blocking to smear,
    // and q95 measures seam 1.00 against 0.91 lossless for half the bytes.
    encode: { quality: 95, effort: 6 },
  },
];

function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    // xorshift32: deterministic across machines, unlike Math.random.
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

const fade = (t) => t * t * (3 - 2 * t);

// One octave of value noise on a cellsX by cellsY lattice that wraps at the
// tile edge, sampled to SIZE x SIZE.
function valueNoiseOctave(cellsX, cellsY, random) {
  const lattice = new Float64Array(cellsX * cellsY);
  for (let i = 0; i < lattice.length; i++) lattice[i] = random();

  const at = (x, y) => lattice[(y % cellsY) * cellsX + (x % cellsX)];
  const out = new Float64Array(SIZE * SIZE);

  for (let py = 0; py < SIZE; py++) {
    const gy = (py / SIZE) * cellsY;
    const y0 = Math.floor(gy);
    const fy = fade(gy - y0);

    for (let px = 0; px < SIZE; px++) {
      const gx = (px / SIZE) * cellsX;
      const x0 = Math.floor(gx);
      const fx = fade(gx - x0);

      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
      out[py * SIZE + px] = top + (bottom - top) * fy;
    }
  }
  return out;
}

function fractalNoise({ cells, octaves, seed }) {
  const random = makeRandom(seed);
  const sum = new Float64Array(SIZE * SIZE);
  let amplitude = 1;
  let total = 0;

  for (let o = 0; o < octaves; o++) {
    const octave = valueNoiseOctave(cells[0] << o, cells[1] << o, random);
    for (let i = 0; i < sum.length; i++) sum[i] += octave[i] * amplitude;
    total += amplitude;
    amplitude /= 2;
  }
  for (let i = 0; i < sum.length; i++) sum[i] /= total;
  return sum;
}

// Centre on 128 and scale so roughly 2.5 standard deviations reach the edge of
// the requested band, then clamp. Keeps the mean at mid-grey whatever the
// distribution does at the tails.
function toGreyBytes(noise, spread) {
  let mean = 0;
  for (const v of noise) mean += v;
  mean /= noise.length;

  let variance = 0;
  for (const v of noise) variance += (v - mean) ** 2;
  const deviation = Math.sqrt(variance / noise.length);

  const scale = (spread * 255) / 2.5;
  const bytes = Buffer.alloc(noise.length);
  for (let i = 0; i < noise.length; i++) {
    const value = 128 + ((noise[i] - mean) / deviation) * scale;
    bytes[i] = Math.max(0, Math.min(255, Math.round(value)));
  }
  return bytes;
}

// A tile is seamless when the wrap-around edge is no more discontinuous than a
// typical neighbouring pair inside it. Ratios near 1 are invisible; a hard seam
// shows up well above 2.
function seamRatio(grey, width, height) {
  const meanAbsDelta = (a, b) => {
    let total = 0;
    for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
    return total / a.length;
  };
  const column = (x) => {
    const out = new Array(height);
    for (let y = 0; y < height; y++) out[y] = grey[y * width + x];
    return out;
  };
  const row = (y) => grey.subarray(y * width, (y + 1) * width);

  let interiorH = 0;
  for (let x = 0; x < width - 1; x++) interiorH += meanAbsDelta(column(x), column(x + 1));
  interiorH /= width - 1;

  let interiorV = 0;
  for (let y = 0; y < height - 1; y++) interiorV += meanAbsDelta(row(y), row(y + 1));
  interiorV /= height - 1;

  return {
    horizontal: meanAbsDelta(column(width - 1), column(0)) / interiorH,
    vertical: meanAbsDelta(row(height - 1), row(0)) / interiorV,
  };
}

await mkdir(OUT_DIR, { recursive: true });

for (const tile of TILES) {
  const grey = toGreyBytes(fractalNoise(tile), tile.spread);
  const webp = await sharp(grey, {
    raw: { width: SIZE, height: SIZE, channels: 1 },
  })
    .webp(tile.encode)
    .toBuffer();
  await writeFile(path.join(OUT_DIR, tile.name), webp);

  // Measure the encoded file, not the buffer: the encoder can reintroduce an
  // edge artefact the generator does not have. See the per-tile encode notes.
  const { data, info } = await sharp(webp)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let min = 255;
  let max = 0;
  let total = 0;
  for (const v of data) {
    if (v < min) min = v;
    if (v > max) max = v;
    total += v;
  }
  const seam = seamRatio(data, info.width, info.height);

  console.log(
    `${tile.name.padEnd(16)} ${String(Math.round(webp.length / 1024)).padStart(4)}KB  ` +
      `range ${min}-${max}  mean ${(total / data.length).toFixed(1)}  ` +
      `seam h:${seam.horizontal.toFixed(2)} v:${seam.vertical.toFixed(2)}`,
  );
}
