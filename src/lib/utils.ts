import { Adjustments } from '../types';

/**
 * Build a CSS filter string for fast live-drag preview.
 * This approximates the pixel-based render in render.ts — not exact but close.
 */
export function getAdjustmentCss(adj: Adjustments): string {
  // Exposure → brightness (approx 2^stops mapping)
  const expMul = Math.pow(2, adj.exposure / 50) * 100; // as %

  // Brightness: direct
  const brightPct = 100 + adj.brightness * 0.8;

  // Combine into a single brightness multiplier
  const finalBrightness = (expMul / 100) * (brightPct / 100) * 100;

  // Contrast
  const contrast = 100 + adj.contrast
    + adj.clarity * 0.35
    + adj.microContrast * 0.12
    + adj.dehaze * 0.25;

  // Saturation
  const saturation = 100 + adj.saturation + adj.vibrance * 0.75 + adj.dehaze * 0.18;

  // Warmth → sepia + hue-rotate
  const sepia = adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.45 : 0);

  // Hue: warmth cool side + tint + direct hue
  const hue = (adj.warmth < 0 ? adj.warmth * 0.28 : 0) + adj.tint * 0.45 + adj.hue;

  // Blur
  const blur = adj.blur * 0.12;

  const grayscale = adj.grayscale;
  const invert = adj.invert;

  // Highlight rolloff: small brightness reduction
  const rolloffB = -(adj.highlightRolloff * 0.022);

  // Shadow lift approximation: slight brightness boost for fade
  const fadeB = adj.fade * 0.06;

  const b = finalBrightness + rolloffB + fadeB;

  return [
    `brightness(${b.toFixed(2)}%)`,
    `contrast(${contrast.toFixed(1)}%)`,
    `saturate(${saturation.toFixed(1)}%)`,
    sepia > 0 ? `sepia(${sepia.toFixed(1)}%)` : '',
    hue !== 0 ? `hue-rotate(${hue.toFixed(1)}deg)` : '',
    grayscale > 0 ? `grayscale(${grayscale.toFixed(1)}%)` : '',
    invert > 0 ? `invert(${invert.toFixed(1)}%)` : '',
    blur > 0 ? `blur(${blur.toFixed(2)}px)` : '',
  ].filter(Boolean).join(' ') || 'none';
}

/** Convert hue angle (degrees) to "r, g, b" string for CSS rgba(). */
export function hueToRgb(hueDeg: number): string {
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
  return `${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)}`;
}
