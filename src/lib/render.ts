import { Adjustments } from '../types';
import { Filter } from './filters';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Yield to browser between heavy steps — prevents main-thread crash on mobile */
const yld = () => new Promise<void>(r => setTimeout(r, 0));

const clamp = (v: number, lo = 0, hi = 255) => v < lo ? lo : v > hi ? hi : v;
const clamp01 = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;

// sRGB ↔ Linear-light LUTs built once at module load
const TO_LINEAR = new Float32Array(256);
const TO_GAMMA = new Uint8Array(65536); // 16-bit index (linear * 65535)
(function buildLuts() {
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  for (let i = 0; i < 65536; i++) {
    const v = i / 65535;
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    TO_GAMMA[i] = Math.round(clamp(g * 255, 0, 255));
  }
})();

const linearToGamma8 = (v: number) => TO_GAMMA[Math.round(clamp01(v) * 65535)];

// RGB ↔ HSL
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/** Convert hue angle (degrees) to [r, g, b] 0-255 */
function hueToRgbArr(hueDeg: number): [number, number, number] {
  const h = ((hueDeg % 360) + 360) % 360;
  const s = 0.65, l = 0.5;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r: number, g: number, b: number;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** Gaussian random (Box-Muller) for film-quality grain */
function gaussianRandom(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Create a tmp canvas same size as src */
function tmpCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return [c, ctx];
}

/**
 * Renders a photo with all filter + adjustment effects onto a canvas.
 * Used for both the live preview (downscaled) and final export (full res).
 * Yields to the browser between heavy steps — prevents mobile main-thread crash.
 */
export async function renderToCanvas(
  imageSrc: string,
  filter: Filter,
  filterIntensity: number,
  adjustments: Adjustments,
  canvas: HTMLCanvasElement,
  maxDimension?: number,
): Promise<void> {

  // ── Load image ─────────────────────────────────────────────────────────────
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  let W = img.naturalWidth;
  let H = img.naturalHeight;
  if (maxDimension && Math.max(W, H) > maxDimension) {
    const scale = maxDimension / Math.max(W, H);
    W = Math.round(W * scale);
    H = Math.round(H * scale);
  }

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── Step 1: High-quality downscale (multi-step for best quality) ────────────
  if (maxDimension && Math.max(img.naturalWidth, img.naturalHeight) > maxDimension * 2) {
    // Two-step downscale for sharpest result
    const midW = Math.round(img.naturalWidth * 0.5);
    const midH = Math.round(img.naturalHeight * 0.5);
    const [mid, midCtx] = tmpCanvas(midW, midH);
    midCtx.drawImage(img, 0, 0, midW, midH);
    ctx.drawImage(mid, 0, 0, W, H);
  } else {
    ctx.drawImage(img, 0, 0, W, H);
  }

  // ── Step 2: Film filter overlay (composited at filterIntensity) ────────────
  if (filter.css !== 'none' && filterIntensity > 0) {
    const [fc, fcCtx] = tmpCanvas(W, H);
    fcCtx.filter = filter.css;
    fcCtx.drawImage(img, 0, 0, W, H);
    fcCtx.filter = 'none';
    ctx.globalAlpha = filterIntensity / 100;
    ctx.drawImage(fc, 0, 0);
    ctx.globalAlpha = 1;
  }

  await yld();

  // ── Step 3: Combined tone + color pass (single pixel loop) ─────────────────
  // This covers: exposure, highlights, shadows, contrast, brightness,
  //              warmth, tint, hue, saturation, vibrance,
  //              sepia, grayscale, invert, microContrast, highlightRolloff
  {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;

    // Pre-compute scalars
    const expStops = adjustments.exposure / 50;          // ±2 stops
    const expMul = Math.pow(2, expStops);
    const brightMul = 1 + adjustments.brightness / 100;
    const contrastFactor = 1 + adjustments.contrast / 100;
    const hiAmt = adjustments.highlights / 200;          // ±0.5
    const shAmt = adjustments.shadows / 200;
    const satAmt = 1 + adjustments.saturation / 100;
    const vibAmt = adjustments.vibrance / 100;
    const warmth = adjustments.warmth / 100;
    const tint = adjustments.tint / 100;
    const hueShiftRad = (adjustments.hue / 360) * 2 * Math.PI;
    const sepiaAmt = adjustments.sepia / 100;
    const grayAmt = adjustments.grayscale / 100;
    const invertAmt = adjustments.invert / 100;
    const mcStrength = (adjustments.microContrast / 100) * 0.42;
    const rolloff = (adjustments.highlightRolloff / 100) * 0.75;
    const rolloffThresh = 0.70;

    for (let i = 0; i < px.length; i += 4) {
      let r = px[i], g = px[i + 1], b = px[i + 2];

      // — Exposure in linear light ——————————————————————————————
      if (adjustments.exposure !== 0) {
        r = linearToGamma8(TO_LINEAR[r] * expMul);
        g = linearToGamma8(TO_LINEAR[g] * expMul);
        b = linearToGamma8(TO_LINEAR[b] * expMul);
      }

      // — Highlights / Shadows (parametric curve) ——————————————
      if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Highlight: affects bright areas (lum > 0.5)
        if (adjustments.highlights !== 0) {
          const hFactor = Math.pow(Math.max(0, lum - 0.4) / 0.6, 1.5) * hiAmt;
          r = clamp(r + hFactor * 255);
          g = clamp(g + hFactor * 255);
          b = clamp(b + hFactor * 255);
        }
        // Shadow: affects dark areas (lum < 0.5)
        if (adjustments.shadows !== 0) {
          const sFactor = Math.pow(Math.max(0, 0.6 - lum) / 0.6, 1.5) * shAmt;
          r = clamp(r + sFactor * 255);
          g = clamp(g + sFactor * 255);
          b = clamp(b + sFactor * 255);
        }
      }

      // — Brightness ————————————————————————————————————————————
      if (adjustments.brightness !== 0) {
        r = clamp(r * brightMul);
        g = clamp(g * brightMul);
        b = clamp(b * brightMul);
      }

      // — Contrast (S-curve around 0.5) ————————————————————————
      if (adjustments.contrast !== 0) {
        r = clamp((r / 255 - 0.5) * contrastFactor * 255 + 127.5);
        g = clamp((g / 255 - 0.5) * contrastFactor * 255 + 127.5);
        b = clamp((b / 255 - 0.5) * contrastFactor * 255 + 127.5);
      }

      // — Warmth (temperature on R-B axis) ——————————————————————
      if (adjustments.warmth !== 0) {
        r = clamp(r + warmth * 28);
        g = clamp(g + warmth * 8);
        b = clamp(b - warmth * 28);
      }

      // — Tint (magenta-green axis) —————————————————————————————
      if (adjustments.tint !== 0) {
        r = clamp(r + tint * 12);
        g = clamp(g - tint * 20);
        b = clamp(b + tint * 12);
      }

      // — Saturation + Vibrance (HSL-based) —————————————————————
      if (adjustments.saturation !== 0 || adjustments.vibrance !== 0) {
        let [h, s, l] = rgbToHsl(r, g, b);
        if (adjustments.saturation !== 0) {
          s = clamp01(s * satAmt);
        }
        if (adjustments.vibrance !== 0) {
          // Vibrance boosts desaturated colors more
          const boost = (1 - s) * vibAmt * 0.6;
          s = clamp01(s + boost);
        }
        [r, g, b] = hslToRgb(h, s, l);
      }

      // — Hue rotation ———————————————————————————————————————————
      if (adjustments.hue !== 0) {
        let [h, s, l] = rgbToHsl(r, g, b);
        h = (h + hueShiftRad / (2 * Math.PI) + 1) % 1;
        [r, g, b] = hslToRgb(h, s, l);
      }

      // — Sepia ——————————————————————————————————————————————————
      if (adjustments.sepia > 0) {
        const sr = clamp(r * (1 - sepiaAmt) + (r * 0.393 + g * 0.769 + b * 0.189) * sepiaAmt);
        const sg = clamp(g * (1 - sepiaAmt) + (r * 0.349 + g * 0.686 + b * 0.168) * sepiaAmt);
        const sb = clamp(b * (1 - sepiaAmt) + (r * 0.272 + g * 0.534 + b * 0.131) * sepiaAmt);
        r = sr; g = sg; b = sb;
      }

      // — Grayscale ——————————————————————————————————————————————
      if (adjustments.grayscale > 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = clamp(r * (1 - grayAmt) + gray * grayAmt);
        g = clamp(g * (1 - grayAmt) + gray * grayAmt);
        b = clamp(b * (1 - grayAmt) + gray * grayAmt);
      }

      // — Invert ————————————————————————————————————————————————
      if (adjustments.invert > 0) {
        r = clamp(r * (1 - invertAmt) + (255 - r) * invertAmt);
        g = clamp(g * (1 - invertAmt) + (255 - g) * invertAmt);
        b = clamp(b * (1 - invertAmt) + (255 - b) * invertAmt);
      }

      // — Micro-contrast (local S-curve — Leica 3D pop) —————————
      if (adjustments.microContrast > 0) {
        const rv = r / 255, gv = g / 255, bv = b / 255;
        const curved = (v: number) => v + mcStrength * (v - 0.5) * (1 - Math.pow(Math.abs(v - 0.5) * 1.8, 1.3));
        r = clamp(curved(rv) * 255);
        g = clamp(curved(gv) * 255);
        b = clamp(curved(bv) * 255);
      }

      // — Highlight rolloff (film shoulder — exponential) ————————
      if (adjustments.highlightRolloff > 0) {
        const applyRolloff = (v: number) => {
          if (v <= rolloffThresh) return v;
          const excess = (v - rolloffThresh) / (1 - rolloffThresh);
          return rolloffThresh + (1 - rolloffThresh) * (1 - Math.exp(-excess * (2 - rolloff)));
        };
        r = clamp(applyRolloff(r / 255) * 255);
        g = clamp(applyRolloff(g / 255) * 255);
        b = clamp(applyRolloff(b / 255) * 255);
      }

      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }

    ctx.putImageData(d, 0, 0);
  }

  await yld();

  // ── Step 4: Clarity (large-radius local contrast boost) ───────────────────
  if (adjustments.clarity !== 0) {
    const amt = adjustments.clarity / 100;
    const radius = Math.max(1, Math.round(W * 0.025)); // ~2.5% of width
    const [blurC, blurX] = tmpCanvas(W, H);
    blurX.filter = `blur(${radius}px)`;
    blurX.drawImage(canvas, 0, 0);
    blurX.filter = 'none';
    const orig = ctx.getImageData(0, 0, W, H);
    const blur = blurX.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    for (let i = 0; i < orig.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const diff = orig.data[i + ch] - blur.data[i + ch];
        out.data[i + ch] = clamp(orig.data[i + ch] + diff * amt * 1.8);
      }
      out.data[i + 3] = orig.data[i + 3];
    }
    ctx.putImageData(out, 0, 0);
    void blurC;
  }

  // ── Step 5: Sharpness (adaptive unsharp mask) ──────────────────────────────
  if (adjustments.sharpness > 0) {
    const amt = adjustments.sharpness / 100;
    // Fine detail pass (small radius)
    const [, blurX1] = tmpCanvas(W, H);
    blurX1.filter = `blur(${0.6 + amt * 0.8}px)`;
    blurX1.drawImage(canvas, 0, 0);
    blurX1.filter = 'none';
    const orig = ctx.getImageData(0, 0, W, H);
    const blur1 = blurX1.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    for (let i = 0; i < orig.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const edge = orig.data[i + ch] - blur1.data[i + ch];
        // Adaptive strength: boost edges more, avoid halos
        const edgeAbs = Math.abs(edge);
        const boost = amt * (1.2 + edgeAbs / 60);
        out.data[i + ch] = clamp(orig.data[i + ch] + edge * boost);
      }
      out.data[i + 3] = orig.data[i + 3];
    }
    ctx.putImageData(out, 0, 0);
  }

  // ── Step 6: Detail (fine texture accentuation) ────────────────────────────
  if (adjustments.detail > 0) {
    const amt = adjustments.detail / 100;
    const [, blurX] = tmpCanvas(W, H);
    blurX.filter = `blur(${1.2 + amt * 1.5}px)`;
    blurX.drawImage(canvas, 0, 0);
    blurX.filter = 'none';
    const orig = ctx.getImageData(0, 0, W, H);
    const blur = blurX.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    for (let i = 0; i < orig.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const diff = orig.data[i + ch] - blur.data[i + ch];
        // Only boost fine details (small differences), not large structures
        const fine = Math.sign(diff) * Math.min(Math.abs(diff), 35);
        out.data[i + ch] = clamp(orig.data[i + ch] + fine * amt * 2.5);
      }
      out.data[i + 3] = orig.data[i + 3];
    }
    ctx.putImageData(out, 0, 0);
  }

  await yld();

  // ── Step 7: Dehaze (contrast + sat + shadow lift) ─────────────────────────
  if (adjustments.dehaze !== 0) {
    const amt = adjustments.dehaze / 100;
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      let r = px[i], g = px[i + 1], b = px[i + 2];
      // Contrast + shadow lift + slight saturation boost
      r = clamp((r / 255 - 0.5) * (1 + amt * 0.4) * 255 + 127.5 + amt * 10);
      g = clamp((g / 255 - 0.5) * (1 + amt * 0.4) * 255 + 127.5 + amt * 10);
      b = clamp((b / 255 - 0.5) * (1 + amt * 0.4) * 255 + 127.5 + amt * 10);
      // Vibrance boost for dehaze
      let [h, s, l] = rgbToHsl(r, g, b);
      s = clamp01(s + (1 - s) * amt * 0.25);
      [r, g, b] = hslToRgb(h, s, l);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 8: Portrait Glow ─────────────────────────────────────────────────
  if (adjustments.portraitGlow > 0) {
    const amt = adjustments.portraitGlow / 100;
    const [pgC, pgX] = tmpCanvas(W, H);
    pgX.filter = `blur(${10 + amt * 20}px) brightness(1.15) saturate(1.2)`;
    pgX.drawImage(canvas, 0, 0);
    pgX.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amt * 0.28;
    ctx.drawImage(pgC, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // Warm color wash
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = `rgba(255, 218, 155, ${amt * 0.18})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 9: Posterize ─────────────────────────────────────────────────────
  if (adjustments.posterize > 0) {
    const levels = Math.max(2, Math.round(32 - (adjustments.posterize / 100) * 29));
    const step = 255 / (levels - 1);
    const d = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i]   = Math.round(Math.round(d.data[i]   / step) * step);
      d.data[i+1] = Math.round(Math.round(d.data[i+1] / step) * step);
      d.data[i+2] = Math.round(Math.round(d.data[i+2] / step) * step);
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 10: Bloom ────────────────────────────────────────────────────────
  if (adjustments.bloom > 0) {
    const amt = adjustments.bloom / 100;
    // Extract highlights only for a more realistic bloom
    const [hC, hX] = tmpCanvas(W, H);
    hX.drawImage(canvas, 0, 0);
    hX.globalCompositeOperation = 'multiply';
    hX.fillStyle = `rgba(0,0,0,${1 - amt * 0.4})`; // darken non-bright areas
    hX.fillRect(0, 0, W, H);
    hX.globalCompositeOperation = 'source-over';
    const [bC, bX] = tmpCanvas(W, H);
    bX.filter = `brightness(1.4) blur(${8 + amt * 22}px)`;
    bX.drawImage(hC, 0, 0);
    bX.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amt * 0.5;
    ctx.drawImage(bC, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    void bC;
  }

  // ── Step 11: Halation (warm glow on bright edges) ─────────────────────────
  if (adjustments.halation > 0) {
    const amt = adjustments.halation / 100;
    const [hC, hX] = tmpCanvas(W, H);
    hX.filter = `brightness(1.6) blur(${12 + amt * 28}px) saturate(1.8) hue-rotate(-20deg)`;
    hX.drawImage(canvas, 0, 0);
    hX.filter = 'none';
    // Tint red-orange (film emulsion glow color)
    hX.globalCompositeOperation = 'multiply';
    hX.fillStyle = `rgba(255, 110, 50, ${0.4 + amt * 0.3})`;
    hX.fillRect(0, 0, W, H);
    hX.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amt * 0.55;
    ctx.drawImage(hC, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 12: Soft Focus ────────────────────────────────────────────────────
  if (adjustments.softFocus > 0) {
    const amt = adjustments.softFocus / 100;
    const [sC, sX] = tmpCanvas(W, H);
    sX.filter = `blur(${2 + amt * 12}px) brightness(1.08)`;
    sX.drawImage(canvas, 0, 0);
    sX.filter = 'none';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amt * 0.42;
    ctx.drawImage(sC, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  await yld();

  // ── Step 13: Chromatic Aberration (RGB channel split + green fringe) ───────
  if (adjustments.chromaticAberration > 0) {
    const shift = Math.max(1, Math.round(W * (adjustments.chromaticAberration / 100) * 0.018));
    const o = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        // Red channel: shifted right
        const rx = Math.min(W - 1, x + shift);
        const ri = (y * W + rx) * 4;
        // Blue channel: shifted left
        const bx = Math.max(0, x - shift);
        const bi = (y * W + bx) * 4;
        // Green channel: slight opposite shift (realistic lens CA)
        const gx = clamp(x + Math.round(shift * 0.3), 0, W - 1);
        const gi = (y * W + gx) * 4;
        out.data[i]     = o.data[ri];
        out.data[i + 1] = o.data[gi + 1];
        out.data[i + 2] = o.data[bi + 2];
        out.data[i + 3] = o.data[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  // ── Step 14: Dispersion (radial prismatic spread) ─────────────────────────
  if (adjustments.dispersion > 0) {
    const amt = adjustments.dispersion / 100;
    const maxShift = Math.max(1, Math.round(W * amt * 0.025));
    const cx2 = W / 2, cy2 = H / 2;
    const o = ctx.getImageData(0, 0, W, H);
    const out = ctx.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const dx = (x - cx2) / cx2, dy = (y - cy2) / cy2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const s = Math.round(maxShift * dist);
        const rx = clamp(x + Math.round(dx * s), 0, W - 1);
        const ry = clamp(y + Math.round(dy * s), 0, H - 1);
        const bx = clamp(x - Math.round(dx * s), 0, W - 1);
        const by = clamp(y - Math.round(dy * s), 0, H - 1);
        const ri = (ry * W + rx) * 4;
        const bi = (by * W + bx) * 4;
        out.data[i]     = o.data[ri];
        out.data[i + 1] = o.data[i + 1];
        out.data[i + 2] = o.data[bi + 2];
        out.data[i + 3] = o.data[i + 3];
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  await yld();

  // ── Step 15: Split Toning (luminosity-based) ──────────────────────────────
  if (adjustments.splitToneShadow !== 0 || adjustments.splitToneHighlight !== 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const [shr, shg, shb] = adjustments.splitToneShadow !== 0 ? hueToRgbArr(adjustments.splitToneShadow) : [0, 0, 0];
    const [hlr, hlg, hlb] = adjustments.splitToneHighlight !== 0 ? hueToRgbArr(adjustments.splitToneHighlight) : [0, 0, 0];

    for (let i = 0; i < px.length; i += 4) {
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      // Shadow weight: max at lum=0, zero at lum=0.6
      const sw = Math.max(0, 1 - lum / 0.6) * 0.22;
      // Highlight weight: max at lum=1, zero at lum=0.4
      const hw = Math.max(0, (lum - 0.4) / 0.6) * 0.20;

      if (adjustments.splitToneShadow !== 0 && sw > 0) {
        px[i]   = clamp(px[i]   * (1 - sw) + shr * sw);
        px[i+1] = clamp(px[i+1] * (1 - sw) + shg * sw);
        px[i+2] = clamp(px[i+2] * (1 - sw) + shb * sw);
      }
      if (adjustments.splitToneHighlight !== 0 && hw > 0) {
        px[i]   = clamp(px[i]   * (1 - hw) + hlr * hw);
        px[i+1] = clamp(px[i+1] * (1 - hw) + hlg * hw);
        px[i+2] = clamp(px[i+2] * (1 - hw) + hlb * hw);
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 16: Film tint overlay ─────────────────────────────────────────────
  if (filter.tintOverlay) {
    ctx.fillStyle = filter.tintOverlay;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Step 17: Shadow tint (radial multiply) ────────────────────────────────
  if (filter.shadowTint) {
    const [sc, sx] = tmpCanvas(W, H);
    const g2 = sx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, Math.max(W, H) * 0.9);
    g2.addColorStop(0, 'rgba(255,255,255,0.97)');
    g2.addColorStop(1, filter.shadowTint);
    sx.fillStyle = g2;
    sx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(sc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 18: Burn edges ────────────────────────────────────────────────────
  if (filter.burnEdges && filter.burnEdges > 0) {
    const [bc, bx] = tmpCanvas(W, H);
    const g2 = bx.createRadialGradient(W / 2, H / 2, W * 0.28, W / 2, H / 2, Math.max(W, H) * 0.82);
    g2.addColorStop(0, 'rgba(255,255,255,1)');
    g2.addColorStop(1, `rgba(0,0,0,${(filter.burnEdges / 100) * 0.9})`);
    bx.fillStyle = g2;
    bx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(bc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 19: Fade (shadow lift, faded film look) ──────────────────────────
  if (adjustments.fade > 0) {
    // Fade = lift the blacks (reduce dynamic range)
    const liftAmt = (adjustments.fade / 100) * 55;
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      const fadeFactor = Math.pow(1 - lum, 1.5); // lifts shadows more
      px[i]   = clamp(px[i]   + fadeFactor * liftAmt);
      px[i+1] = clamp(px[i+1] + fadeFactor * liftAmt);
      px[i+2] = clamp(px[i+2] + fadeFactor * liftAmt);
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 20: Vignette (smooth power-law falloff) ──────────────────────────
  if (adjustments.vignette > 0) {
    const amt = adjustments.vignette / 100;
    const [vc, vx] = tmpCanvas(W, H);
    const cx = W / 2, cy = H / 2;
    // Elliptical radial gradient matching image aspect
    const grd = vx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(0.5, `rgba(0,0,0,${amt * 0.25})`);
    grd.addColorStop(1, `rgba(0,0,0,${amt * 0.95})`);
    vx.fillStyle = grd;
    vx.fillRect(0, 0, W, H);
    ctx.drawImage(vc, 0, 0);
  }

  await yld();

  // ── Step 21: Grain (gaussian-distributed, luminance-aware) ────────────────
  if (adjustments.grain > 0) {
    const amt = adjustments.grain / 100;
    const grainSize = Math.max(256, W); // tile at image width for fine grain
    const [gc, gx] = tmpCanvas(grainSize, grainSize);
    const nd = gx.createImageData(grainSize, grainSize);
    for (let i = 0; i < nd.data.length; i += 4) {
      // Gaussian grain: mean=128, sigma scaled by amount
      const noise = gaussianRandom() * amt * 38 + 128;
      const v = clamp(Math.round(noise));
      nd.data[i] = nd.data[i + 1] = nd.data[i + 2] = v;
      nd.data[i + 3] = Math.round(amt * 140); // alpha controls overall strength
    }
    gx.putImageData(nd, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = amt * 0.65;
    const pattern = ctx.createPattern(gc, 'repeat')!;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 22: Light Leak (top-left corner) ─────────────────────────────────
  if (adjustments.lightLeak > 0) {
    const a = adjustments.lightLeak / 100;
    ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(0, 0, 0, W * 0.1, H * 0.1, W * 0.65);
    rg.addColorStop(0, `rgba(255,80,10,${a * 0.85})`);
    rg.addColorStop(0.3, `rgba(255,140,20,${a * 0.5})`);
    rg.addColorStop(0.6, `rgba(255,180,60,${a * 0.2})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 23: Film Burn (bottom-right) ─────────────────────────────────────
  if (adjustments.filmBurn > 0) {
    const a = adjustments.filmBurn / 100;
    ctx.globalCompositeOperation = 'screen';
    const rg = ctx.createRadialGradient(W, H, 0, W * 0.85, H * 0.85, W * 0.65);
    rg.addColorStop(0, `rgba(255,210,60,${a * 0.85})`);
    rg.addColorStop(0.3, `rgba(255,120,10,${a * 0.5})`);
    rg.addColorStop(0.6, `rgba(200,60,0,${a * 0.2})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 24: Dust ─────────────────────────────────────────────────────────
  if (adjustments.dust > 0) {
    const a = adjustments.dust / 100;
    const [dc] = tmpCanvas(300, 300);
    const dx = dc.getContext('2d')!;
    dx.strokeStyle = `rgba(255,255,255,${a * 0.7})`; dx.lineWidth = 0.8;
    dx.fillStyle = `rgba(255,255,255,${a * 0.6})`;
    // Draw random dust particles
    const rng = (s = 1) => Math.sin(s * 9301 + 49297) * 0.5 + 0.5;
    for (let k = 0; k < 20; k++) {
      const x = rng(k * 3) * 300, y = rng(k * 7) * 300;
      const r = 0.4 + rng(k * 13) * 1.8;
      if (k % 3 === 0) {
        dx.beginPath(); dx.moveTo(x, y); dx.lineTo(x + r * 4, y + r * 2); dx.stroke();
      } else {
        dx.beginPath(); dx.arc(x, y, r, 0, Math.PI * 2); dx.fill();
      }
    }
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = a * 0.9;
    const pattern = ctx.createPattern(dc, 'repeat')!;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 25: Scan Lines ────────────────────────────────────────────────────
  if (adjustments.scanLines > 0) {
    const a = (adjustments.scanLines / 100) * 0.55;
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y + 2, W, 2);
  }

  // ── Step 26: Pixelate ─────────────────────────────────────────────────────
  if (adjustments.pixelate > 0) {
    const blockSize = Math.max(3, Math.round((adjustments.pixelate / 100) * 60));
    const pw = Math.max(1, Math.ceil(W / blockSize));
    const ph = Math.max(1, Math.ceil(H / blockSize));
    const [tc] = tmpCanvas(pw, ph);
    const tx = tc.getContext('2d')!;
    tx.imageSmoothingEnabled = false;
    tx.drawImage(canvas, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(tc, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
}
