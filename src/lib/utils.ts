import { Adjustments } from '../types';

export function getAdjustmentCss(adj: Adjustments): string {
  // Exposure is a combination of brightness and contrast
  const b = 100 + adj.brightness + (adj.exposure * 0.5) + (adj.shadows * 0.3) + (adj.highlights * 0.2);
  const c = 100 + adj.contrast + (adj.exposure * 0.2) - (adj.fade * 0.2) + (adj.highlights * 0.3) - (adj.shadows * 0.1) + (adj.clarity * 0.3) + (adj.dehaze * 0.2);

  // Vibrance is a smart saturation, we simulate it by adding less saturation if saturation is already high
  const s = 100 + adj.saturation + (adj.vibrance * 0.8) + (adj.dehaze * 0.15);

  const sepia = adj.sepia + (adj.warmth > 0 ? adj.warmth * 0.5 : 0);
  const hue = (adj.warmth < 0 ? adj.warmth * 0.3 : 0) + (adj.tint * 0.5) + adj.hue;
  const blur = adj.blur * 0.1;
  const grayscale = adj.grayscale;
  const invert = adj.invert;

  // Dehaze boosts brightness slightly to compensate for contrast increase
  const dehazeB = adj.dehaze > 0 ? adj.dehaze * 0.1 : 0;

  // Sharpness and Detail: show as contrast proxy in preview (real pixel sharpening happens on export)
  const sharpBoost = adj.sharpness * 0.12;
  const detailBoost = adj.detail * 0.06;

  const finalB = b + dehazeB;
  const finalC = c + sharpBoost + detailBoost;

  return `brightness(${finalB}%) contrast(${finalC}%) saturate(${s}%) sepia(${sepia}%) hue-rotate(${hue}deg) grayscale(${grayscale}%) invert(${invert}%) blur(${blur}px)`;
}
