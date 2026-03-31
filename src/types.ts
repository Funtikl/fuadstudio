export interface Adjustments {
  // Tone
  exposure: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  // Detail
  sharpness: number;
  detail: number;
  clarity: number;
  dehaze: number;
  microContrast: number;      // Leica/Hasselblad S-curve local contrast (3D pop)
  highlightRolloff: number;   // Gentle highlight shoulder compression
  // Color
  saturation: number;
  vibrance: number;
  warmth: number;
  tint: number;
  hue: number;
  // Split Tone
  splitToneShadow: number;    // Hue angle for shadow tint (-180 to 180)
  splitToneHighlight: number; // Hue angle for highlight tint (-180 to 180)
  // Classic Effects
  sepia: number;
  grayscale: number;
  invert: number;
  blur: number;
  fade: number;
  // Analog / Film
  bloom: number;
  vignette: number;
  grain: number;
  lightLeak: number;
  dust: number;
  halation: number;
  chromaticAberration: number;
  softFocus: number;
  filmBurn: number;
  portraitGlow: number;       // Warm skin-tone enhancing glow
  // Creative
  posterize: number;
  pixelate: number;
  scanLines: number;
  dispersion: number;
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
  microContrast: 0,
  highlightRolloff: 0,
  saturation: 0,
  vibrance: 0,
  warmth: 0,
  tint: 0,
  hue: 0,
  splitToneShadow: 0,
  splitToneHighlight: 0,
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
  softFocus: 0,
  filmBurn: 0,
  portraitGlow: 0,
  posterize: 0,
  pixelate: 0,
  scanLines: 0,
  dispersion: 0,
};
