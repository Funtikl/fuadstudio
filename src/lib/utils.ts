import { Adjustments } from '../types';

/**
 * Build a CSS filter string for fast live-drag preview.
 *
 * Maps user adjustments to CSS equivalents that closely approximate
 * the Oklab render pipeline — minimising the visual "jump" when the
 * committed render replaces the draft CSS preview.
 */
export function getAdjustmentCss(adj: Adjustments): string {

  // ── Exposure: 2^(ev/50) stops → CSS brightness% ─────────────────────────
  const expMul = Math.pow(2, adj.exposure / 50);

  // ── Brightness: Oklab L += adj/100*0.18, roughly +0.95% CSS brightness ──
  const brightMul = 1 + (adj.brightness / 100) * 0.95;

  // Combine exposure + brightness into one brightness value
  let brightness = expMul * brightMul * 100;

  // ── Contrast: pivot-0.5 Oklab ≈ CSS contrast ─────────────────────────────
  // Oklab: contK = filter_contrast * (1 + adj.contrast/100)
  // CSS approximation: 100 + adj.contrast (user portion only here)
  let contrast = 100 + adj.contrast;

  // Clarity: local contrast boost → approximate as global contrast
  contrast += adj.clarity * 0.35;
  // Micro-contrast: subtle contrast lift
  contrast += adj.microContrast * 0.08;
  // Dehaze: raises contrast + slight brightness correction
  contrast   += adj.dehaze * 0.30;
  brightness += adj.dehaze * (-0.02 * (adj.dehaze > 0 ? 1 : -1));
  // Highlight rolloff: very slight brightness reduction
  brightness -= adj.highlightRolloff * 0.018;
  // Fade: lifts blacks → slight brightness increase
  brightness += adj.fade * 0.05;

  // ── Saturation: Oklab chroma scale ≈ CSS saturate ───────────────────────
  // Vibrance boosts low-sat colours more → ~0.70× effective saturation
  let saturation = 100 + adj.saturation + adj.vibrance * 0.70;
  // Subtractive mixing: chroma boost darkens slightly
  const satBoost = Math.max(0, adj.saturation + adj.vibrance * 0.70);
  brightness -= satBoost * 0.007;
  saturation += adj.dehaze * 0.15;

  // ── Warmth / Tint / Hue ──────────────────────────────────────────────────
  // Warmth positive → sepia-like amber; negative → cool blue
  const sepiaPct  = adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.38 : 0);
  const hueRotate = (adj.warmth < 0 ? adj.warmth * 0.24 : 0)
    + adj.tint * 0.42
    + adj.hue;

  // ── Classic ──────────────────────────────────────────────────────────────
  const grayscale = adj.grayscale;
  const invert    = adj.invert;
  const blurPx    = adj.blur * 0.10;

  return [
    `brightness(${Math.max(0, brightness).toFixed(2)}%)`,
    `contrast(${Math.max(0, contrast).toFixed(1)}%)`,
    `saturate(${Math.max(0, saturation).toFixed(1)}%)`,
    sepiaPct > 0    ? `sepia(${Math.min(100, sepiaPct).toFixed(1)}%)` : '',
    hueRotate !== 0 ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : '',
    grayscale > 0   ? `grayscale(${grayscale.toFixed(1)}%)` : '',
    invert > 0      ? `invert(${invert.toFixed(1)}%)` : '',
    blurPx > 0      ? `blur(${blurPx.toFixed(2)}px)` : '',
  ].filter(Boolean).join(' ') || 'none';
}

/** Convert hue angle (degrees) → "r, g, b" string for CSS rgba(). */
export function hueToRgb(hueDeg: number): string {
  const h = ((hueDeg % 360) + 360) % 360;
  const s = 0.65, l = 0.5;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r: number, g: number, b: number;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return `${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}`;
}
