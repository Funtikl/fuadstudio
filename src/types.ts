export interface Adjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  detail: number;
  clarity: number;
  dehaze: number;
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  hue: number;
  sepia: number;
  grayscale: number;
  invert: number;
  blur: number;
  fade: number;
  bloom: number;
  vignette: number;
  grain: number;
  lightLeak: number;
  dust: number;
  halation: number;
  chromaticAberration: number;
}

export interface Photo {
  id: string;
  src: string;
  filterId: string;
  filterIntensity?: number;
  adjustments: Adjustments;
  createdAt: number;
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  detail: 0,
  clarity: 0,
  dehaze: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  hue: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  blur: 0,
  fade: 0,
  bloom: 0,
  vignette: 0,
  grain: 0,
  lightLeak: 0,
  dust: 0,
  halation: 0,
  chromaticAberration: 0,
};
