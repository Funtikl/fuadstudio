export type FilterCategory = 'Leica' | 'Film' | 'Hasselblad';

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

  // ─── STANDARD (no-op — must always be first) ────────────────────────────────
  { id: 'standard', name: 'Original', category: 'Leica',
    css: 'none' },

  // ─── LEICA ───────────────────────────────────────────────────────────────────
  // Each filter is designed to be CLEARLY different from the original.
  // CSS filter is the strongest layer — visible immediately in thumbnails.
  // Pixel passes (microContrast, splitTone, halation) add further depth.

  // Leica Authentic — signature Leica M character: punchy blacks, warm rendition
  { id: 'leica_authentic', name: 'Authentic', category: 'Leica',
    css: 'contrast(1.22) saturate(0.90) brightness(1.05) hue-rotate(3deg)',
    grain: 8, vignette: 26, fade: 5,
    microContrast: 62, highlightRolloff: 38,
    tintOverlay: 'rgba(255, 248, 232, 0.07)',
    splitToneShadowHue: 222, splitToneHighlightHue: 34 },

  // Leica Vibrant — Xiaomi×Leica Vibrant mode: punchy, saturated, modern
  { id: 'leica_vibrant', name: 'Vibrant', category: 'Leica',
    css: 'contrast(1.38) saturate(1.50) brightness(1.02) hue-rotate(-4deg)',
    grain: 6, vignette: 18, fade: 2,
    microContrast: 54, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 236, 200, 0.08)',
    splitToneShadowHue: 205, splitToneHighlightHue: 40 },

  // Leica M Classic — cool street rangefinder look, silver-blue shadows
  { id: 'leica_m_classic', name: 'M Classic', category: 'Leica',
    css: 'contrast(1.30) saturate(0.80) brightness(1.00) hue-rotate(6deg)',
    grain: 16, vignette: 34, fade: 7,
    microContrast: 58, highlightRolloff: 28,
    tintOverlay: 'rgba(210, 226, 245, 0.07)',
    splitToneShadowHue: 218, splitToneHighlightHue: 32,
    shadowTint: 'rgba(30, 44, 95, 0.11)' },

  // Leica Summilux — f/1.4 warmth: creamy bokeh, amber glow, film-like
  { id: 'leica_summilux', name: 'Summilux', category: 'Leica',
    css: 'contrast(1.24) saturate(1.14) brightness(1.04) sepia(0.12)',
    grain: 12, vignette: 36, fade: 8, softFocus: 10,
    microContrast: 52, highlightRolloff: 38,
    tintOverlay: 'rgba(255, 228, 185, 0.09)',
    splitToneShadowHue: 218, splitToneHighlightHue: 38 },

  // Leica APO-Summicron — clinical sharpness king: maximum micro-contrast, neutral
  { id: 'leica_apo', name: 'APO', category: 'Leica',
    css: 'contrast(1.28) saturate(0.94) brightness(1.02)',
    grain: 4, vignette: 14, fade: 2,
    microContrast: 75, highlightRolloff: 42,
    splitToneShadowHue: 215, splitToneHighlightHue: 28,
    shadowTint: 'rgba(28, 44, 100, 0.08)' },

  // Leica Noctilux — f/0.95 legend: painterly glow, heavy vignette, halation
  { id: 'leica_noctilux', name: 'Noctilux', category: 'Leica',
    css: 'contrast(1.36) saturate(1.06) brightness(0.93) sepia(0.08)',
    grain: 26, vignette: 58, fade: 9, halation: 48, bloom: 30, softFocus: 14,
    microContrast: 42, highlightRolloff: 52,
    tintOverlay: 'rgba(240, 220, 190, 0.06)',
    splitToneShadowHue: 230, splitToneHighlightHue: 26,
    shadowTint: 'rgba(18, 26, 72, 0.16)' },

  // Leica SL2 — modern mirrorless: clean, warm-neutral, resolving
  { id: 'leica_sl2', name: 'SL2', category: 'Leica',
    css: 'contrast(1.18) saturate(1.10) brightness(1.04)',
    grain: 4, vignette: 18, fade: 2,
    microContrast: 50, highlightRolloff: 36,
    tintOverlay: 'rgba(252, 246, 235, 0.05)',
    splitToneShadowHue: 220, splitToneHighlightHue: 32 },

  // Leica Monochrom — dedicated B&W sensor: razor sharp, dramatic tones
  { id: 'leica_monochrom', name: 'Monochrom', category: 'Leica',
    css: 'grayscale(1) contrast(1.38) brightness(0.97)',
    grain: 30, vignette: 30, fade: 3,
    microContrast: 72, highlightRolloff: 18 },

  // Leica Q3 — compact 28mm Summilux: decisive, punchy, wide
  { id: 'leica_q3', name: 'Q3', category: 'Leica',
    css: 'contrast(1.26) saturate(1.18) brightness(1.02) hue-rotate(-3deg)',
    grain: 6, vignette: 28, fade: 3,
    microContrast: 54, highlightRolloff: 32,
    tintOverlay: 'rgba(254, 244, 228, 0.06)',
    splitToneShadowHue: 212, splitToneHighlightHue: 36 },

  // Leica Portrait — skin-tone optimized: glowing warmth, soft rolloff
  { id: 'leica_portrait', name: 'Portrait', category: 'Leica',
    css: 'contrast(1.12) saturate(1.22) brightness(1.10) sepia(0.06)',
    grain: 7, vignette: 34, fade: 9, softFocus: 20,
    microContrast: 36, highlightRolloff: 55,
    portraitGlow: 40,
    tintOverlay: 'rgba(255, 234, 210, 0.11)',
    splitToneShadowHue: 208, splitToneHighlightHue: 42 },


  // ─── FILM ────────────────────────────────────────────────────────────────────

  // Kodak Portra 160 — finest grain, legendary skin tones, lifted shadows
  { id: 'portra_160', name: 'Portra 160', category: 'Film',
    css: 'sepia(0.10) contrast(0.94) saturate(1.16) hue-rotate(-4deg) brightness(1.06)',
    grain: 10, vignette: 14, fade: 7,
    microContrast: 14, highlightRolloff: 24,
    tintOverlay: 'rgba(255, 232, 205, 0.08)',
    splitToneShadowHue: 28, splitToneHighlightHue: 44 },

  // Kodak Portra 400 — the portrait standard, warm pastels, pushed midtones
  { id: 'portra_400', name: 'Portra 400', category: 'Film',
    css: 'sepia(0.14) contrast(0.96) saturate(1.20) hue-rotate(-5deg) brightness(1.07)',
    grain: 26, vignette: 18, fade: 9,
    microContrast: 16, highlightRolloff: 26,
    tintOverlay: 'rgba(255, 224, 196, 0.09)',
    splitToneShadowHue: 26, splitToneHighlightHue: 42 },

  // Kodak Portra 800 — pushed grain, slight magenta shadows, creamy highlights
  { id: 'portra_800', name: 'Portra 800', category: 'Film',
    css: 'sepia(0.16) contrast(1.00) saturate(1.22) hue-rotate(-6deg) brightness(1.05)',
    grain: 42, vignette: 22, fade: 10,
    microContrast: 18, highlightRolloff: 28,
    tintOverlay: 'rgba(255, 216, 188, 0.10)',
    splitToneShadowHue: 315, splitToneHighlightHue: 38 },

  // Fuji Pro 400H — cool-green shadows, soft pastels, wedding film
  { id: 'fuji_pro_400h', name: 'Pro 400H', category: 'Film',
    css: 'sepia(0.03) contrast(0.94) saturate(1.12) hue-rotate(12deg) brightness(1.09)',
    grain: 20, vignette: 14, fade: 6,
    microContrast: 12, highlightRolloff: 20,
    tintOverlay: 'rgba(200, 232, 215, 0.08)',
    splitToneShadowHue: 162, splitToneHighlightHue: 46 },

  // Fuji Superia 400 — punchy greens, warm highlights, consumer stock
  { id: 'superia_400', name: 'Superia 400', category: 'Film',
    css: 'contrast(1.16) saturate(1.38) hue-rotate(7deg) sepia(0.08) brightness(0.99)',
    grain: 34, vignette: 24, fade: 5,
    microContrast: 20,
    splitToneShadowHue: 148, splitToneHighlightHue: 34 },

  // CineStill 800T — tungsten cinema, teal shadows, red halation glow
  { id: 'cinestill_800t', name: 'CineStill 800T', category: 'Film',
    css: 'sepia(0.05) contrast(1.18) saturate(1.26) hue-rotate(-14deg) brightness(1.04)',
    grain: 48, vignette: 30, lightLeak: 10, halation: 46, fade: 9,
    microContrast: 24, highlightRolloff: 26,
    tintOverlay: 'rgba(155, 200, 238, 0.09)',
    splitToneShadowHue: 198, splitToneHighlightHue: -14 },

  // CineStill 50D — daylight cinema, fine grain, subtle glow
  { id: 'cinestill_50d', name: 'CineStill 50D', category: 'Film',
    css: 'contrast(1.10) saturate(1.20) hue-rotate(-2deg) sepia(0.05) brightness(1.05)',
    grain: 12, vignette: 18, halation: 18, fade: 4,
    microContrast: 22, highlightRolloff: 24 },

  // Fuji Velvia 50 — ultra-saturated slide film, vivid landscape
  { id: 'velvia_50', name: 'Velvia 50', category: 'Film',
    css: 'contrast(1.42) saturate(1.68) hue-rotate(-4deg) brightness(0.95)',
    grain: 8, vignette: 30, fade: 2,
    microContrast: 30, highlightRolloff: 10 },

  // Fuji Provia 100F — balanced slide, neutral, accurate
  { id: 'provia_100f', name: 'Provia 100F', category: 'Film',
    css: 'contrast(1.18) saturate(1.28) hue-rotate(2deg) brightness(1.04)',
    grain: 10, vignette: 16, fade: 3,
    microContrast: 22, highlightRolloff: 18 },

  // Kodachrome 64 — iconic warmth, deep reds/blues, high micro-contrast
  { id: 'kodachrome', name: 'Kodachrome', category: 'Film',
    css: 'sepia(0.18) contrast(1.28) saturate(1.32) hue-rotate(-12deg) brightness(0.97)',
    grain: 20, vignette: 32, dust: 8, fade: 8,
    microContrast: 28, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 205, 165, 0.10)',
    splitToneShadowHue: -10, splitToneHighlightHue: 32 },

  // Kodak Ektar 100 — ultra-vivid reds and blues, finest grain
  { id: 'ektar_100', name: 'Ektar 100', category: 'Film',
    css: 'contrast(1.22) saturate(1.58) hue-rotate(2deg) brightness(1.03)',
    grain: 7, vignette: 20, fade: 2,
    microContrast: 24, highlightRolloff: 14 },

  // Kodak Gold 200 — nostalgic golden warmth
  { id: 'gold_200', name: 'Gold 200', category: 'Film',
    css: 'sepia(0.24) contrast(1.08) saturate(1.26) hue-rotate(-16deg) brightness(1.08)',
    grain: 32, vignette: 24, lightLeak: 8, fade: 10,
    microContrast: 14, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 224, 160, 0.11)',
    splitToneShadowHue: 24, splitToneHighlightHue: 48 },

  // Kodak ColorPlus 200 — budget warm, heavy grain, expired character
  { id: 'colorplus_200', name: 'ColorPlus 200', category: 'Film',
    css: 'sepia(0.28) contrast(1.04) saturate(1.18) hue-rotate(-8deg) brightness(1.06)',
    grain: 46, vignette: 30, dust: 8, fade: 13,
    microContrast: 10, highlightRolloff: 18,
    tintOverlay: 'rgba(255, 222, 172, 0.11)' },

  // Lomography 400 — cross-processed, heavy vignette, bold
  { id: 'lomo_400', name: 'Lomo 400', category: 'Film',
    css: 'sepia(0.08) contrast(1.38) saturate(1.55) hue-rotate(14deg) brightness(1.03)',
    grain: 52, vignette: 50, lightLeak: 38, dust: 18, fade: 5,
    microContrast: 26 },

  // Agfa Vista 200 — bold greens, European street color
  { id: 'agfa_vista', name: 'Agfa Vista', category: 'Film',
    css: 'contrast(1.15) saturate(1.40) hue-rotate(8deg) sepia(0.04) brightness(1.02)',
    grain: 30, vignette: 24, fade: 5,
    microContrast: 20,
    splitToneShadowHue: 172, splitToneHighlightHue: 34 },

  // Polaroid 600 — instant film, faded, low contrast, nostalgic
  { id: 'polaroid_600', name: 'Polaroid 600', category: 'Film',
    css: 'sepia(0.16) contrast(0.86) saturate(1.08) hue-rotate(-5deg) brightness(1.12)',
    grain: 32, vignette: 50, lightLeak: 22, dust: 26, fade: 18,
    highlightRolloff: 26,
    tintOverlay: 'rgba(240, 234, 208, 0.11)',
    splitToneShadowHue: 54, splitToneHighlightHue: 46 },

  // Ilford HP5 Plus — classic B&W street, wide latitude
  { id: 'ilford_hp5', name: 'Ilford HP5', category: 'Film',
    css: 'grayscale(1) contrast(1.20) brightness(1.05)',
    grain: 40, vignette: 20, fade: 5,
    microContrast: 24, highlightRolloff: 18 },

  // Ilford FP4 Plus — fine grain, rich tonal range
  { id: 'ilford_fp4', name: 'Ilford FP4', category: 'Film',
    css: 'grayscale(1) contrast(1.14) brightness(1.05)',
    grain: 18, vignette: 16, fade: 3,
    microContrast: 20, highlightRolloff: 20 },

  // Ilford Delta 3200 — pushed, deep blacks, gritty
  { id: 'ilford_delta', name: 'Delta 3200', category: 'Film',
    css: 'grayscale(1) contrast(1.36) brightness(1.05)',
    grain: 60, vignette: 28, fade: 3,
    microContrast: 28, highlightRolloff: 8 },

  // Kodak Tri-X 400 — gritty street legend, deep blacks
  { id: 'tri_x_400', name: 'Tri-X 400', category: 'Film',
    css: 'grayscale(1) contrast(1.40) brightness(0.96)',
    grain: 56, vignette: 30, fade: 4,
    microContrast: 30, highlightRolloff: 8 },

  // Kodak T-Max 400 — sharper than Tri-X, fine-grain
  { id: 'tmax_400', name: 'T-Max 400', category: 'Film',
    css: 'grayscale(1) contrast(1.22) brightness(1.04)',
    grain: 28, vignette: 20, fade: 3,
    microContrast: 26, highlightRolloff: 20 },

  // Fuji Neopan Acros 100 — finest B&W grain, butter midtones
  { id: 'neopan_100', name: 'Neopan 100', category: 'Film',
    css: 'grayscale(1) contrast(1.15) brightness(1.07)',
    grain: 12, vignette: 14, fade: 2,
    microContrast: 20, highlightRolloff: 18 },


  // ─── HASSELBLAD ──────────────────────────────────────────────────────────────

  // Hasselblad Natural — faithful medium-format rendering
  { id: 'hassy_natural', name: 'Natural', category: 'Hasselblad',
    css: 'contrast(1.08) saturate(1.06) brightness(1.02)',
    grain: 3, vignette: 10, fade: 3,
    microContrast: 36, highlightRolloff: 38,
    tintOverlay: 'rgba(248, 250, 252, 0.03)',
    splitToneShadowHue: 230, splitToneHighlightHue: 34 },

  // Hasselblad Portrait — widest highlight rolloff, skin tones, warm glow
  { id: 'hassy_portrait', name: 'Portrait', category: 'Hasselblad',
    css: 'contrast(1.05) saturate(1.10) brightness(1.07) sepia(0.04)',
    grain: 4, vignette: 22, fade: 7, softFocus: 16,
    microContrast: 30, highlightRolloff: 50,
    portraitGlow: 30,
    tintOverlay: 'rgba(252, 245, 236, 0.07)',
    splitToneShadowHue: 224, splitToneHighlightHue: 40 },

  // Hasselblad Landscape — vivid greens, rich midtones
  { id: 'hassy_landscape', name: 'Landscape', category: 'Hasselblad',
    css: 'contrast(1.16) saturate(1.28) hue-rotate(3deg) brightness(0.99)',
    grain: 4, vignette: 24, fade: 2,
    microContrast: 42, highlightRolloff: 26,
    splitToneShadowHue: 206, splitToneHighlightHue: 44 },

  // Hasselblad X2D 100C — 100MP, extreme resolution, neutral
  { id: 'hassy_x2d', name: 'X2D 100C', category: 'Hasselblad',
    css: 'contrast(1.08) saturate(1.07) brightness(1.02)',
    grain: 2, vignette: 8, fade: 2,
    microContrast: 40, highlightRolloff: 40,
    splitToneShadowHue: 220, splitToneHighlightHue: 32,
    tintOverlay: 'rgba(250, 250, 252, 0.02)' },

  // Hasselblad 503CW Studio — classic medium format studio
  { id: 'hassy_studio', name: '503CW Studio', category: 'Hasselblad',
    css: 'contrast(1.10) saturate(0.98) brightness(1.05)',
    grain: 3, vignette: 6, fade: 2,
    microContrast: 38, highlightRolloff: 50,
    splitToneShadowHue: 224, splitToneHighlightHue: 32 },

  // Hasselblad Monochrome — CFV achromatic back
  { id: 'hassy_mono', name: 'Monochrome', category: 'Hasselblad',
    css: 'grayscale(1) contrast(1.16) brightness(1.04)',
    grain: 4, vignette: 14, fade: 3,
    microContrast: 50, highlightRolloff: 36 },

  // Hasselblad Chrome — rich colour, cool shadows, cinematic
  { id: 'hassy_chrome', name: 'Chrome', category: 'Hasselblad',
    css: 'contrast(1.18) saturate(1.16) brightness(0.99) hue-rotate(-3deg)',
    grain: 5, vignette: 18, fade: 3,
    microContrast: 44, highlightRolloff: 30,
    splitToneShadowHue: 222, splitToneHighlightHue: 32,
    shadowTint: 'rgba(24, 34, 85, 0.08)' },

];
