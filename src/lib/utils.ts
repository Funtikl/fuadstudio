import { Adjustments } from '../types';

export function getAdjustmentCss(adj: Adjustments): string {
  // Exposure drives brightness + contrast together
  const b = 100 + adj.brightness + (adj.exposure * 0.5) + (adj.shadows * 0.3) + (adj.highlights * 0.2);
  const c = 100 + adj.contrast + (adj.exposure * 0.2) - (adj.fade * 0.2)
    + (adj.highlights * 0.3) - (adj.shadows * 0.1)
    + (adj.clarity * 0.3) + (adj.dehaze * 0.2)
    + (adj.sharpness * 0.12) + (adj.detail * 0.06)
    // Micro-contrast shows as a midtone contrast boost in preview
    + (adj.microContrast * 0.10);

  const s = 100 + adj.saturation + (adj.vibrance * 0.8) + (adj.dehaze * 0.15);

  const sepia = adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.5 : 0);
  const hue = (adj.warmth < 0 ? adj.warmth * 0.3 : 0) + (adj.tint * 0.5) + adj.hue;
  const blur = adj.blur * 0.1;
  const grayscale = adj.grayscale;
  const invert = adj.invert;

  const dehazeB = adj.dehaze > 0 ? adj.dehaze * 0.1 : 0;
  // Highlight rolloff: gently pull down brightness on high values (CSS proxy)
  const rolloffB = -(adj.highlightRolloff * 0.025);

  const finalB = b + dehazeB + rolloffB;

  return `brightness(${finalB}%) contrast(${c}%) saturate(${s}%) sepia(${sepia}%) hue-rotate(${hue}deg) grayscale(${grayscale}%) invert(${invert}%) blur(${blur}px)`;
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
