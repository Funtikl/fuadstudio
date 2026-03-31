export type FilterCategory = 'Film' | 'Leica' | 'Hasselblad';

export type Filter = {
  id: string;
  name: string;
  category: FilterCategory;
  css: string;
  // Analog film effects
  grain?: number;
  vignette?: number;
  lightLeak?: number;
  dust?: number;
  halation?: number;
  fade?: number;
  bloom?: number;
  softFocus?: number;
  filmBurn?: number;
  scanLines?: number;
  chromaticAberration?: number;
  // Color science
  tintOverlay?: string;
  shadowTint?: string;
  burnEdges?: number;
  // Camera system signature effects
  microContrast?: number;
  highlightRolloff?: number;
  portraitGlow?: number;
  splitToneShadowHue?: number;
  splitToneHighlightHue?: number;
};

export const FILTERS: Filter[] = [

  // ─── FILM ────────────────────────────────────────────────────────────────────

  // Kodak Portra 160 — finest grain, legendary skin tones, lifted shadows
  { id: 'portra_160', name: 'Portra 160', category: 'Film',
    css: 'sepia(0.06) contrast(0.92) saturate(1.12) hue-rotate(-3deg) brightness(1.05)',
    grain: 8, vignette: 12, fade: 6,
    microContrast: 12, highlightRolloff: 22,
    tintOverlay: 'rgba(255, 235, 210, 0.06)',
    splitToneShadowHue: 28, splitToneHighlightHue: 42 },

  // Kodak Portra 400 — the portrait standard, warm pastels, pushed midtones
  { id: 'portra_400', name: 'Portra 400', category: 'Film',
    css: 'sepia(0.10) contrast(0.94) saturate(1.16) hue-rotate(-4deg) brightness(1.06)',
    grain: 22, vignette: 16, fade: 8,
    microContrast: 14, highlightRolloff: 24,
    tintOverlay: 'rgba(255, 228, 200, 0.07)',
    splitToneShadowHue: 26, splitToneHighlightHue: 40 },

  // Kodak Portra 800 — pushed grain, slight magenta shadows, creamy highlights
  { id: 'portra_800', name: 'Portra 800', category: 'Film',
    css: 'sepia(0.12) contrast(0.97) saturate(1.18) hue-rotate(-5deg) brightness(1.04)',
    grain: 38, vignette: 20, fade: 9,
    microContrast: 16, highlightRolloff: 26,
    tintOverlay: 'rgba(255, 220, 195, 0.08)',
    splitToneShadowHue: 315, splitToneHighlightHue: 36 },

  // Fuji Pro 400H — cool-green shadows, soft pastels, wedding film
  { id: 'fuji_pro_400h', name: 'Pro 400H', category: 'Film',
    css: 'sepia(0.02) contrast(0.92) saturate(1.08) hue-rotate(10deg) brightness(1.08)',
    grain: 18, vignette: 12, fade: 5,
    microContrast: 10, highlightRolloff: 18,
    tintOverlay: 'rgba(205, 235, 218, 0.06)',
    splitToneShadowHue: 162, splitToneHighlightHue: 44 },

  // Fuji Superia 400 — punchy greens, warm highlights, consumer stock
  { id: 'superia_400', name: 'Superia 400', category: 'Film',
    css: 'contrast(1.12) saturate(1.30) hue-rotate(6deg) sepia(0.06) brightness(0.99)',
    grain: 32, vignette: 22, fade: 5,
    microContrast: 18,
    splitToneShadowHue: 148, splitToneHighlightHue: 32 },

  // CineStill 800T — tungsten cinema stock, teal shadows, red halation glow
  { id: 'cinestill_800t', name: 'CineStill 800T', category: 'Film',
    css: 'sepia(0.04) contrast(1.14) saturate(1.20) hue-rotate(-12deg) brightness(1.03)',
    grain: 44, vignette: 28, lightLeak: 10, halation: 42, fade: 8,
    microContrast: 22, highlightRolloff: 24,
    tintOverlay: 'rgba(160, 205, 238, 0.07)',
    splitToneShadowHue: 200, splitToneHighlightHue: -12 },

  // CineStill 50D — daylight cinema, fine grain, subtle glow, accurate color
  { id: 'cinestill_50d', name: 'CineStill 50D', category: 'Film',
    css: 'contrast(1.08) saturate(1.16) hue-rotate(-2deg) sepia(0.04) brightness(1.04)',
    grain: 10, vignette: 16, halation: 16, fade: 4,
    microContrast: 20, highlightRolloff: 22 },

  // Fuji Velvia 50 — ultra-saturated slide film, deep blacks, vivid landscape
  { id: 'velvia_50', name: 'Velvia 50', category: 'Film',
    css: 'contrast(1.35) saturate(1.58) hue-rotate(-3deg) brightness(0.96)',
    grain: 6, vignette: 28, fade: 2,
    microContrast: 28, highlightRolloff: 10 },

  // Fuji Provia 100F — balanced slide, neutral, accurate with mild saturation
  { id: 'provia_100f', name: 'Provia 100F', category: 'Film',
    css: 'contrast(1.16) saturate(1.24) hue-rotate(2deg) brightness(1.03)',
    grain: 8, vignette: 14, fade: 3,
    microContrast: 20, highlightRolloff: 16 },

  // Kodachrome 64 — legendary iconic warmth, deep reds/blues, high microcontrast
  { id: 'kodachrome', name: 'Kodachrome', category: 'Film',
    css: 'sepia(0.14) contrast(1.24) saturate(1.26) hue-rotate(-10deg) brightness(0.97)',
    grain: 18, vignette: 30, dust: 8, fade: 7,
    microContrast: 26, highlightRolloff: 18,
    tintOverlay: 'rgba(255, 208, 172, 0.08)',
    splitToneShadowHue: -8, splitToneHighlightHue: 30 },

  // Kodak Ektar 100 — ultra-vivid reds and blues, finest grain color neg
  { id: 'ektar_100', name: 'Ektar 100', category: 'Film',
    css: 'contrast(1.18) saturate(1.52) hue-rotate(2deg) brightness(1.02)',
    grain: 6, vignette: 18, fade: 2,
    microContrast: 22, highlightRolloff: 12 },

  // Kodak Gold 200 — nostalgic golden warmth, consumer classic
  { id: 'gold_200', name: 'Gold 200', category: 'Film',
    css: 'sepia(0.20) contrast(1.07) saturate(1.22) hue-rotate(-14deg) brightness(1.07)',
    grain: 30, vignette: 22, lightLeak: 8, fade: 9,
    microContrast: 12, highlightRolloff: 18,
    tintOverlay: 'rgba(255, 228, 168, 0.09)',
    splitToneShadowHue: 24, splitToneHighlightHue: 46 },

  // Kodak ColorPlus 200 — budget warm film, heavy grain, expired character
  { id: 'colorplus_200', name: 'ColorPlus 200', category: 'Film',
    css: 'sepia(0.24) contrast(1.03) saturate(1.14) hue-rotate(-7deg) brightness(1.05)',
    grain: 42, vignette: 28, dust: 7, fade: 12,
    microContrast: 8, highlightRolloff: 16,
    tintOverlay: 'rgba(255, 224, 178, 0.09)' },

  // Lomography 400 — cross-processed, heavy vignette, unpredictable, bold
  { id: 'lomo_400', name: 'Lomo 400', category: 'Film',
    css: 'sepia(0.07) contrast(1.32) saturate(1.46) hue-rotate(12deg) brightness(1.02)',
    grain: 48, vignette: 46, lightLeak: 35, dust: 16, fade: 5,
    microContrast: 24 },

  // Agfa Vista 200 — bold greens, European street color
  { id: 'agfa_vista', name: 'Agfa Vista', category: 'Film',
    css: 'contrast(1.12) saturate(1.34) hue-rotate(7deg) sepia(0.03) brightness(1.01)',
    grain: 28, vignette: 22, fade: 5,
    microContrast: 18,
    splitToneShadowHue: 172, splitToneHighlightHue: 32 },

  // Polaroid 600 — instant film, faded, low contrast, heavy borders
  { id: 'polaroid_600', name: 'Polaroid 600', category: 'Film',
    css: 'sepia(0.12) contrast(0.85) saturate(1.05) hue-rotate(-4deg) brightness(1.10)',
    grain: 30, vignette: 46, lightLeak: 20, dust: 24, fade: 16,
    highlightRolloff: 24,
    tintOverlay: 'rgba(240, 235, 210, 0.09)',
    splitToneShadowHue: 52, splitToneHighlightHue: 44 },

  // Ilford HP5 Plus — classic B&W street, wide latitude, timeless
  { id: 'ilford_hp5', name: 'Ilford HP5', category: 'Film',
    css: 'grayscale(1) contrast(1.16) brightness(1.04)',
    grain: 38, vignette: 18, fade: 5,
    microContrast: 22, highlightRolloff: 16 },

  // Ilford FP4 Plus — fine grain, rich tonal range, smooth gradation
  { id: 'ilford_fp4', name: 'Ilford FP4', category: 'Film',
    css: 'grayscale(1) contrast(1.10) brightness(1.04)',
    grain: 16, vignette: 14, fade: 3,
    microContrast: 18, highlightRolloff: 18 },

  // Ilford Delta 3200 — pushed high-ISO, dramatic deep blacks, gritty
  { id: 'ilford_delta', name: 'Delta 3200', category: 'Film',
    css: 'grayscale(1) contrast(1.30) brightness(1.05)',
    grain: 55, vignette: 26, fade: 3,
    microContrast: 26, highlightRolloff: 8 },

  // Kodak Tri-X 400 — gritty street legend, acutance, deep blacks
  { id: 'tri_x_400', name: 'Tri-X 400', category: 'Film',
    css: 'grayscale(1) contrast(1.34) brightness(0.96)',
    grain: 52, vignette: 28, fade: 4,
    microContrast: 28, highlightRolloff: 8 },

  // Kodak T-Max 400 — sharper than Tri-X, fine-grain, smooth tones
  { id: 'tmax_400', name: 'T-Max 400', category: 'Film',
    css: 'grayscale(1) contrast(1.18) brightness(1.03)',
    grain: 26, vignette: 18, fade: 3,
    microContrast: 24, highlightRolloff: 18 },

  // Fuji Neopan Acros 100 — finest B&W grain, butter-smooth midtones
  { id: 'neopan_100', name: 'Neopan 100', category: 'Film',
    css: 'grayscale(1) contrast(1.12) brightness(1.06)',
    grain: 10, vignette: 12, fade: 2,
    microContrast: 18, highlightRolloff: 16 },


  // ─── LEICA ───────────────────────────────────────────────────────────────────

  // Leica Authentic — faithful SOOC, understated, honest rendering
  { id: 'leica_authentic', name: 'Authentic', category: 'Leica',
    css: 'contrast(1.05) saturate(0.95) brightness(1.02)',
    grain: 4, vignette: 10, fade: 4,
    microContrast: 44, highlightRolloff: 32,
    tintOverlay: 'rgba(252, 248, 240, 0.03)',
    splitToneShadowHue: 222, splitToneHighlightHue: 30 },

  // Leica Vibrant — Xiaomi/Leica Vibrant mode, punchy but refined
  { id: 'leica_vibrant', name: 'Vibrant', category: 'Leica',
    css: 'contrast(1.12) saturate(1.18) brightness(1.03) hue-rotate(-2deg)',
    grain: 5, vignette: 14, fade: 3,
    microContrast: 46, highlightRolloff: 24,
    tintOverlay: 'rgba(255, 244, 228, 0.05)',
    splitToneShadowHue: 208, splitToneHighlightHue: 36 },

  // Leica M Classic — M rangefinder street, slight cool noble character
  { id: 'leica_m_classic', name: 'M Classic', category: 'Leica',
    css: 'contrast(1.10) saturate(0.93) brightness(1.01)',
    grain: 8, vignette: 18, fade: 5,
    microContrast: 48, highlightRolloff: 26,
    tintOverlay: 'rgba(246, 244, 238, 0.03)',
    splitToneShadowHue: 218, splitToneHighlightHue: 30,
    shadowTint: 'rgba(30, 40, 80, 0.05)' },

  // Leica Summilux — f/1.4 creamy bokeh, warm microcontrast, painting quality
  { id: 'leica_summilux', name: 'Summilux', category: 'Leica',
    css: 'contrast(1.14) saturate(1.03) brightness(1.0) sepia(0.03)',
    grain: 6, vignette: 24, fade: 5, softFocus: 7,
    microContrast: 42, highlightRolloff: 30,
    splitToneShadowHue: 220, splitToneHighlightHue: 34 },

  // Leica APO-Summicron — clinical resolution king, maximum microcontrast
  { id: 'leica_apo', name: 'APO-Summicron', category: 'Leica',
    css: 'contrast(1.07) saturate(0.98) brightness(1.01)',
    grain: 3, vignette: 6, fade: 3,
    microContrast: 56, highlightRolloff: 36,
    splitToneShadowHue: 218, splitToneHighlightHue: 26,
    shadowTint: 'rgba(28, 44, 100, 0.04)' },

  // Leica Noctilux — f/0.95 legend: glow, vignette, painterly separation
  { id: 'leica_noctilux', name: 'Noctilux', category: 'Leica',
    css: 'contrast(1.18) saturate(1.06) brightness(0.97) sepia(0.04)',
    grain: 18, vignette: 38, fade: 6, halation: 28, bloom: 18, softFocus: 10,
    microContrast: 36, highlightRolloff: 44,
    splitToneShadowHue: 230, splitToneHighlightHue: 24,
    shadowTint: 'rgba(18, 26, 72, 0.09)' },

  // Leica SL2 — modern mirrorless, highest resolving, clean warm neutral
  { id: 'leica_sl2', name: 'SL2', category: 'Leica',
    css: 'contrast(1.06) saturate(1.03) brightness(1.02)',
    grain: 3, vignette: 10, fade: 3,
    microContrast: 38, highlightRolloff: 34,
    splitToneShadowHue: 224, splitToneHighlightHue: 28,
    tintOverlay: 'rgba(250, 248, 242, 0.02)' },

  // Leica Monochrom — dedicated B&W sensor, pure luminance, razor sharpness
  { id: 'leica_monochrom', name: 'Monochrom', category: 'Leica',
    css: 'grayscale(1) contrast(1.16) brightness(1.02)',
    grain: 22, vignette: 20, fade: 5,
    microContrast: 58, highlightRolloff: 22 },

  // Leica Q3 — compact 28mm Summilux: wide, punchy, decisive moment
  { id: 'leica_q3', name: 'Q3', category: 'Leica',
    css: 'contrast(1.08) saturate(1.05) brightness(1.02) hue-rotate(-1deg)',
    grain: 4, vignette: 20, fade: 3,
    microContrast: 42, highlightRolloff: 30,
    tintOverlay: 'rgba(252, 248, 240, 0.03)',
    splitToneShadowHue: 216, splitToneHighlightHue: 32 },

  // Leica Portrait — skin-tone optimized, smooth rolloff, warm glow
  { id: 'leica_portrait', name: 'Portrait', category: 'Leica',
    css: 'contrast(1.03) saturate(1.06) brightness(1.05) sepia(0.02)',
    grain: 5, vignette: 22, fade: 6, softFocus: 12,
    microContrast: 32, highlightRolloff: 44,
    portraitGlow: 26,
    tintOverlay: 'rgba(255, 244, 232, 0.06)',
    splitToneShadowHue: 212, splitToneHighlightHue: 38 },


  // ─── HASSELBLAD ──────────────────────────────────────────────────────────────

  // Hasselblad Natural — faithful medium-format rendering, OnePlus SOOC
  { id: 'hassy_natural', name: 'Natural', category: 'Hasselblad',
    css: 'contrast(1.05) saturate(1.03) brightness(1.01)',
    grain: 3, vignette: 8, fade: 3,
    microContrast: 34, highlightRolloff: 36,
    tintOverlay: 'rgba(248, 250, 252, 0.02)',
    splitToneShadowHue: 230, splitToneHighlightHue: 32 },

  // Hasselblad Portrait — widest highlight rolloff, perfect skin, warm glow
  { id: 'hassy_portrait', name: 'Portrait', category: 'Hasselblad',
    css: 'contrast(1.02) saturate(1.06) brightness(1.05) sepia(0.02)',
    grain: 3, vignette: 20, fade: 6, softFocus: 14,
    microContrast: 28, highlightRolloff: 46,
    portraitGlow: 28,
    tintOverlay: 'rgba(252, 248, 242, 0.05)',
    splitToneShadowHue: 224, splitToneHighlightHue: 38 },

  // Hasselblad Landscape — outdoor polarized, vivid greens, rich midtones
  { id: 'hassy_landscape', name: 'Landscape', category: 'Hasselblad',
    css: 'contrast(1.12) saturate(1.22) hue-rotate(3deg) brightness(0.99)',
    grain: 4, vignette: 22, fade: 2,
    microContrast: 40, highlightRolloff: 24,
    splitToneShadowHue: 208, splitToneHighlightHue: 42 },

  // Hasselblad X2D 100C — 100MP medium format, extreme resolution, neutral
  { id: 'hassy_x2d', name: 'X2D 100C', category: 'Hasselblad',
    css: 'contrast(1.06) saturate(1.05) brightness(1.01)',
    grain: 2, vignette: 8, fade: 2,
    microContrast: 38, highlightRolloff: 38,
    splitToneShadowHue: 220, splitToneHighlightHue: 30,
    tintOverlay: 'rgba(250, 250, 252, 0.02)' },

  // Hasselblad 503CW Studio — classic medium format studio, timeless, balanced
  { id: 'hassy_studio', name: '503CW Studio', category: 'Hasselblad',
    css: 'contrast(1.07) saturate(0.97) brightness(1.04)',
    grain: 3, vignette: 6, fade: 2,
    microContrast: 36, highlightRolloff: 48,
    splitToneShadowHue: 224, splitToneHighlightHue: 30 },

  // Hasselblad Monochrome — CFV achromatic back, brutal resolution in B&W
  { id: 'hassy_mono', name: 'Monochrome', category: 'Hasselblad',
    css: 'grayscale(1) contrast(1.12) brightness(1.03)',
    grain: 4, vignette: 12, fade: 3,
    microContrast: 48, highlightRolloff: 34 },

  // Hasselblad Chrome — rich colour, cool shadows, cinematic rendering
  { id: 'hassy_chrome', name: 'Chrome', category: 'Hasselblad',
    css: 'contrast(1.14) saturate(1.12) brightness(0.99) hue-rotate(-2deg)',
    grain: 5, vignette: 16, fade: 3,
    microContrast: 42, highlightRolloff: 28,
    splitToneShadowHue: 222, splitToneHighlightHue: 30,
    shadowTint: 'rgba(24, 34, 85, 0.06)' },

];
