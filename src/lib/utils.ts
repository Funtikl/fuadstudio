import { Adjustments } from '../types';

/**
 * Build a CSS filter string for fast live-drag preview.
 *
 * Goals:
 *   – Approximate the Oklab pixel render closely enough for real-time feedback
 *   – Never cause a visible "jump" when transitioning from draft→rendered preview
 *
 * Mapping strategy mirrors render.ts processing order:
 *   Exposure → Brightness → Contrast → Highlights/Shadows → Colour → Effects
 */
export function getAdjustmentCss(adj: Adjustments): string {

  // ── Exposure (2^stops → brightness%) ────────────────────────────────────────
  const expPct = Math.pow(2, adj.exposure / 50) * 100;

  // ── Brightness (additive Oklab L ≈ multiplicative CSS brightness) ────────────
  // In Oklab: L += adj.brightness/100 * 0.18
  // Rough CSS equivalent: +1% brightness per unit
  const brightPct = 100 + adj.brightness * 0.95;

  // ── Combine exposure + brightness ────────────────────────────────────────────
  let brightness = (expPct / 100) * (brightPct / 100) * 100;

  // ── Contrast (pivot at 0.5 in Oklab ≈ same in CSS) ───────────────────────────
  let contrast = 100 + adj.contrast;

  // Clarity boosts local contrast — approximate as global contrast
  contrast += adj.clarity * 0.38;

  // Micro-contrast: slight contrast lift
  contrast += adj.microContrast * 0.10;

  // Dehaze: contrast + brightness correction
  contrast   += adj.dehaze * 0.28;
  brightness += adj.dehaze * (-0.018 * (adj.dehaze > 0 ? 1 : -1));

  // Highlight rolloff: gentle brightness reduction in the top zone
  // (only noticeable when highlights are bright)
  brightness -= adj.highlightRolloff * 0.022;

  // Fade lifts blacks — approximate as slight brightness increase
  brightness += adj.fade * 0.055;

  // ── Saturation + Vibrance ────────────────────────────────────────────────────
  // Vibrance in render.ts boosts low-sat colours more, ~0.75× as strong overall
  let saturation = 100 + adj.saturation + adj.vibrance * 0.75;

  // Subtractive colour mixing: more chroma slightly darkens — model as tiny -brightness
  const satBoost = Math.max(0, adj.saturation + adj.vibrance * 0.75);
  brightness -= satBoost * 0.008;

  // Dehaze saturation boost
  saturation += adj.dehaze * 0.18;

  // ── Warmth (Oklab b-axis shift → approx sepia + hue-rotate) ─────────────────
  // Positive warmth: add sepia-like warmth + slight amber hue-rotate
  // Negative warmth: cool hue-rotate
  const sepiaPct = adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.40 : 0);
  // Warmth cool side + tint + direct hue
  const hueRotate = (adj.warmth < 0 ? adj.warmth * 0.26 : 0)
    + adj.tint * 0.44
    + adj.hue;

  // ── Classic effects ──────────────────────────────────────────────────────────
  const grayscale = adj.grayscale;
  const invert    = adj.invert;
  const blur      = adj.blur * 0.10;

  return [
    `brightness(${brightness.toFixed(2)}%)`,
    `contrast(${contrast.toFixed(1)}%)`,
    `saturate(${saturation.toFixed(1)}%)`,
    sepiaPct > 0     ? `sepia(${Math.min(100, sepiaPct).toFixed(1)}%)` : '',
    hueRotate !== 0  ? `hue-rotate(${hueRotate.toFixed(1)}deg)` : '',
    grayscale > 0    ? `grayscale(${grayscale.toFixed(1)}%)` : '',
    invert > 0       ? `invert(${invert.toFixed(1)}%)` : '',
    blur > 0         ? `blur(${blur.toFixed(2)}px)` : '',
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
