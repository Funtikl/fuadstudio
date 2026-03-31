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

  // ─── FILM ───────────────────────────────────────────────────────────────────

  // Kodak Portra 160 — finest Portra grain, pastel palette, lifted shadows, beautiful skin
  { id: 'portra_160', name: 'Portra 160', category: 'Film',
    css: 'sepia(0.05) contrast(0.90) saturate(1.10) hue-rotate(-2deg) brightness(1.05)',
    grain: 10, vignette: 10, fade: 5,
    microContrast: 10, highlightRolloff: 18,
    tintOverlay: 'rgba(255, 238, 215, 0.05)',
    splitToneShadowHue: 30, splitToneHighlightHue: 40 },

  // Kodak Portra 400 — the portrait standard, warm skin, pushed pastels
  { id: 'portra_400', name: 'Portra 400', category: 'Film',
    css: 'sepia(0.08) contrast(0.93) saturate(1.14) hue-rotate(-3deg) brightness(1.06)',
    grain: 20, vignette: 14, fade: 6,
    microContrast: 12, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 232, 208, 0.06)',
    splitToneShadowHue: 28, splitToneHighlightHue: 38 },

  // Kodak Portra 800 — pushed Portra, more grain, slightly magenta cast in shadows
  { id: 'portra_800', name: 'Portra 800', category: 'Film',
    css: 'sepia(0.10) contrast(0.96) saturate(1.16) hue-rotate(-4deg) brightness(1.04)',
    grain: 36, vignette: 18, fade: 7,
    microContrast: 14, highlightRolloff: 22,
    tintOverlay: 'rgba(255, 225, 200, 0.07)',
    splitToneShadowHue: 320, splitToneHighlightHue: 35 },

  // Fuji Pro 400H — cool greens in shadows, soft, pastel highlights, wedding film
  { id: 'fuji_pro_400h', name: 'Pro 400H', category: 'Film',
    css: 'sepia(0.02) contrast(0.91) saturate(1.06) hue-rotate(8deg) brightness(1.07)',
    grain: 16, vignette: 10, fade: 4,
    microContrast: 10, highlightRolloff: 15,
    tintOverlay: 'rgba(210, 238, 222, 0.05)',
    splitToneShadowHue: 160, splitToneHighlightHue: 42 },

  // Fuji Superia 400 — punchy consumer, green-shifted shadows, warm highlights
  { id: 'superia_400', name: 'Superia 400', category: 'Film',
    css: 'contrast(1.10) saturate(1.28) hue-rotate(5deg) sepia(0.05) brightness(0.99)',
    grain: 30, vignette: 20, fade: 5,
    microContrast: 16,
    splitToneShadowHue: 145, splitToneHighlightHue: 30 },

  // CineStill 800T — tungsten cinema stock, halation rings, teal shadows, red highlights
  { id: 'cinestill_800t', name: 'CineStill 800T', category: 'Film',
    css: 'sepia(0.03) contrast(1.12) saturate(1.18) hue-rotate(-10deg) brightness(1.03)',
    grain: 40, vignette: 24, lightLeak: 12, halation: 38, fade: 7,
    microContrast: 20, highlightRolloff: 22,
    tintOverlay: 'rgba(175, 210, 238, 0.06)',
    splitToneShadowHue: 195, splitToneHighlightHue: -15 },

  // CineStill 50D — daylight cinema film, balanced, fine grain, subtle halation
  { id: 'cinestill_50d', name: 'CineStill 50D', category: 'Film',
    css: 'contrast(1.07) saturate(1.15) hue-rotate(-2deg) sepia(0.04) brightness(1.04)',
    grain: 8, vignette: 14, halation: 14, fade: 3,
    microContrast: 18, highlightRolloff: 20 },

  // Fuji Velvia 50 — legendary landscape slide, ultra-saturated, deep blacks, vivid
  { id: 'velvia_50', name: 'Velvia 50', category: 'Film',
    css: 'contrast(1.32) saturate(1.52) hue-rotate(-2deg) brightness(0.97)',
    grain: 6, vignette: 26, fade: 2,
    microContrast: 24, highlightRolloff: 10 },

  // Fuji Provia 100F — balanced slide, accurate with mild saturation boost
  { id: 'provia_100f', name: 'Provia 100F', category: 'Film',
    css: 'contrast(1.15) saturate(1.22) hue-rotate(2deg) brightness(1.03)',
    grain: 8, vignette: 12, fade: 3,
    microContrast: 18, highlightRolloff: 14 },

  // Kodachrome 64 — legendary warmth, deep reds/blues, high microcontrast, iconic grain
  { id: 'kodachrome', name: 'Kodachrome', category: 'Film',
    css: 'sepia(0.12) contrast(1.22) saturate(1.24) hue-rotate(-8deg) brightness(0.98)',
    grain: 16, vignette: 28, dust: 8, fade: 6,
    microContrast: 22, highlightRolloff: 16,
    tintOverlay: 'rgba(255, 212, 180, 0.07)',
    splitToneShadowHue: -10, splitToneHighlightHue: 28 },

  // Kodak Ektar 100 — finest-grain color neg, ultra-vivid reds and blues
  { id: 'ektar_100', name: 'Ektar 100', category: 'Film',
    css: 'contrast(1.16) saturate(1.48) hue-rotate(2deg) brightness(1.02)',
    grain: 6, vignette: 16, fade: 2,
    microContrast: 20, highlightRolloff: 12 },

  // Kodak Gold 200 — consumer warm film, nostalgic golden cast, medium grain
  { id: 'gold_200', name: 'Gold 200', category: 'Film',
    css: 'sepia(0.18) contrast(1.06) saturate(1.20) hue-rotate(-12deg) brightness(1.06)',
    grain: 28, vignette: 20, lightLeak: 8, fade: 8,
    microContrast: 12, highlightRolloff: 16,
    tintOverlay: 'rgba(255, 232, 178, 0.08)',
    splitToneShadowHue: 25, splitToneHighlightHue: 45 },

  // Kodak ColorPlus 200 — budget warm film, heavy grain, expired look
  { id: 'colorplus_200', name: 'ColorPlus 200', category: 'Film',
    css: 'sepia(0.22) contrast(1.02) saturate(1.12) hue-rotate(-6deg) brightness(1.04)',
    grain: 40, vignette: 26, dust: 6, fade: 10,
    microContrast: 8, highlightRolloff: 14,
    tintOverlay: 'rgba(255, 228, 185, 0.08)' },

  // Lomography 400 — cross-processed, saturated, unpredictable, heavy vignette
  { id: 'lomo_400', name: 'Lomo 400', category: 'Film',
    css: 'sepia(0.06) contrast(1.28) saturate(1.42) hue-rotate(10deg) brightness(1.03)',
    grain: 45, vignette: 42, lightLeak: 32, dust: 14, fade: 5,
    microContrast: 22 },

  // Agfa Vista 200 — bold greens and blues, European color
  { id: 'agfa_vista', name: 'Agfa Vista', category: 'Film',
    css: 'contrast(1.10) saturate(1.32) hue-rotate(6deg) sepia(0.03) brightness(1.01)',
    grain: 26, vignette: 20, fade: 4,
    microContrast: 16,
    splitToneShadowHue: 170, splitToneHighlightHue: 30 },

  // Polaroid 600 — instant film, faded, low contrast, yellow-green cast, heavy border
  { id: 'polaroid_600', name: 'Polaroid 600', category: 'Film',
    css: 'sepia(0.10) contrast(0.84) saturate(1.04) hue-rotate(-3deg) brightness(1.09)',
    grain: 28, vignette: 42, lightLeak: 18, dust: 22, fade: 14,
    highlightRolloff: 22,
    tintOverlay: 'rgba(242, 238, 215, 0.08)',
    splitToneShadowHue: 55, splitToneHighlightHue: 42 },

  // Ilford HP5 Plus — classic street B&W, wide latitude
  { id: 'ilford_hp5', name: 'Ilford HP5', category: 'Film',
    css: 'grayscale(1) contrast(1.14) brightness(1.04)',
    grain: 36, vignette: 16, fade: 4,
    microContrast: 20, highlightRolloff: 14 },

  // Ilford FP4 Plus — fine-grain, rich tonal range
  { id: 'ilford_fp4', name: 'Ilford FP4', category: 'Film',
    css: 'grayscale(1) contrast(1.08) brightness(1.04)',
    grain: 16, vignette: 12, fade: 3,
    microContrast: 16, highlightRolloff: 16 },

  // Ilford Delta 3200 — pushed high-ISO, dramatic, deep blacks
  { id: 'ilford_delta', name: 'Delta 3200', category: 'Film',
    css: 'grayscale(1) contrast(1.28) brightness(1.06)',
    grain: 50, vignette: 24, fade: 3,
    microContrast: 24, highlightRolloff: 10 },

  // Kodak Tri-X 400 — gritty street legend, high acutance
  { id: 'tri_x_400', name: 'Tri-X 400', category: 'Film',
    css: 'grayscale(1) contrast(1.32) brightness(0.97)',
    grain: 48, vignette: 26, fade: 4,
    microContrast: 26, highlightRolloff: 10 },

  // Kodak T-Max 400 — sharper, finer-grain B&W than Tri-X
  { id: 'tmax_400', name: 'T-Max 400', category: 'Film',
    css: 'grayscale(1) contrast(1.16) brightness(1.03)',
    grain: 24, vignette: 16, fade: 3,
    microContrast: 22, highlightRolloff: 16 },

  // Fuji Neopan Acros 100 — finest B&W grain, smooth tones
  { id: 'neopan_100', name: 'Neopan 100', category: 'Film',
    css: 'grayscale(1) contrast(1.10) brightness(1.06)',
    grain: 10, vignette: 10, fade: 2,
    microContrast: 16, highlightRolloff: 14 },


  // ─── LEICA ──────────────────────────────────────────────────────────────────
  // Xiaomi/Leica color science + M-system lens rendering signatures

  // Leica Authentic — faithful, understated, no enhanced saturation (Xiaomi 12S/13/14 Ultra SOOC)
  { id: 'leica_authentic', name: 'Authentic', category: 'Leica',
    css: 'contrast(1.04) saturate(0.94) brightness(1.02)',
    grain: 5, vignette: 10, fade: 4,
    microContrast: 40, highlightRolloff: 30,
    tintOverlay: 'rgba(252, 248, 240, 0.03)',
    splitToneShadowHue: 220, splitToneHighlightHue: 30 },

  // Leica Vibrant — Xiaomi/Leica "Vibrant" mode: punchy but not garish, warm highlight bias
  { id: 'leica_vibrant', name: 'Vibrant', category: 'Leica',
    css: 'contrast(1.10) saturate(1.16) brightness(1.03) hue-rotate(-2deg)',
    grain: 6, vignette: 14, fade: 3,
    microContrast: 42, highlightRolloff: 22,
    tintOverlay: 'rgba(255, 246, 232, 0.04)',
    splitToneShadowHue: 205, splitToneHighlightHue: 35 },

  // Leica M Classic — M rangefinder street character, slight cool bias
  { id: 'leica_m_classic', name: 'M Classic', category: 'Leica',
    css: 'contrast(1.08) saturate(0.92) brightness(1.01)',
    grain: 8, vignette: 16, fade: 4,
    microContrast: 44, highlightRolloff: 24,
    tintOverlay: 'rgba(248, 246, 240, 0.03)',
    splitToneShadowHue: 215, splitToneHighlightHue: 30,
    shadowTint: 'rgba(35, 45, 85, 0.04)' },

  // Leica Summilux — f/1.4 character: creamy bokeh, warm microcontrast
  { id: 'leica_summilux', name: 'Summilux', category: 'Leica',
    css: 'contrast(1.12) saturate(1.02) brightness(1.0) sepia(0.02)',
    grain: 6, vignette: 22, fade: 4, softFocus: 6,
    microContrast: 38, highlightRolloff: 28,
    splitToneShadowHue: 218, splitToneHighlightHue: 32 },

  // Leica APO-Summicron — clinical resolution king, maximum microcontrast
  { id: 'leica_apo', name: 'APO-Summicron', category: 'Leica',
    css: 'contrast(1.06) saturate(0.98) brightness(1.01)',
    grain: 3, vignette: 6, fade: 3,
    microContrast: 50, highlightRolloff: 34,
    splitToneShadowHue: 218, splitToneHighlightHue: 26,
    shadowTint: 'rgba(30, 48, 105, 0.03)' },

  // Leica Noctilux — f/0.95: halation glow, vignette, painterly separation, legend
  { id: 'leica_noctilux', name: 'Noctilux', category: 'Leica',
    css: 'contrast(1.16) saturate(1.04) brightness(0.97) sepia(0.03)',
    grain: 16, vignette: 36, fade: 5, halation: 24, bloom: 16, softFocus: 8,
    microContrast: 34, highlightRolloff: 40,
    splitToneShadowHue: 228, splitToneHighlightHue: 24,
    shadowTint: 'rgba(20, 28, 75, 0.08)' },

  // Leica SL2 — modern mirrorless, highest resolving, clean warm neutral
  { id: 'leica_sl2', name: 'SL2', category: 'Leica',
    css: 'contrast(1.05) saturate(1.02) brightness(1.02)',
    grain: 3, vignette: 10, fade: 3,
    microContrast: 36, highlightRolloff: 32,
    splitToneShadowHue: 222, splitToneHighlightHue: 28,
    tintOverlay: 'rgba(250, 248, 242, 0.02)' },

  // Leica Monochrom — dedicated B&W sensor: no Bayer, pure luminance, razor sharpness
  { id: 'leica_monochrom', name: 'Monochrom', category: 'Leica',
    css: 'grayscale(1) contrast(1.14) brightness(1.02)',
    grain: 20, vignette: 18, fade: 5,
    microContrast: 54, highlightRolloff: 20 },

  // Leica Q3 — compact 28mm f/1.7 Summilux: wide, punchy, street-friendly
  { id: 'leica_q3', name: 'Q3', category: 'Leica',
    css: 'contrast(1.07) saturate(1.04) brightness(1.02) hue-rotate(-1deg)',
    grain: 4, vignette: 18, fade: 3,
    microContrast: 40, highlightRolloff: 28,
    tintOverlay: 'rgba(252, 248, 240, 0.03)',
    splitToneShadowHue: 214, splitToneHighlightHue: 32 },

  // Leica Portrait — skin-tone optimized, smooth rolloff, warm portrait glow
  { id: 'leica_portrait', name: 'Portrait', category: 'Leica',
    css: 'contrast(1.02) saturate(1.05) brightness(1.04) sepia(0.02)',
    grain: 5, vignette: 20, fade: 5, softFocus: 10,
    microContrast: 30, highlightRolloff: 40,
    portraitGlow: 22,
    tintOverlay: 'rgba(255, 246, 236, 0.05)',
    splitToneShadowHue: 210, splitToneHighlightHue: 36 },


  // ─── HASSELBLAD ─────────────────────────────────────────────────────────────
  // OnePlus/Hasselblad partnership + medium-format digital color science

  // Hasselblad Natural — faithful medium-format rendering (OnePlus 10 Pro/11/12 SOOC)
  { id: 'hassy_natural', name: 'Natural', category: 'Hasselblad',
    css: 'contrast(1.04) saturate(1.02) brightness(1.01)',
    grain: 3, vignette: 8, fade: 3,
    microContrast: 32, highlightRolloff: 34,
    tintOverlay: 'rgba(248, 250, 252, 0.02)',
    splitToneShadowHue: 228, splitToneHighlightHue: 32 },

  // Hasselblad Portrait — medium-format portrait: widest highlight rolloff, warm glow
  { id: 'hassy_portrait', name: 'Portrait', category: 'Hasselblad',
    css: 'contrast(1.02) saturate(1.05) brightness(1.04) sepia(0.02)',
    grain: 3, vignette: 18, fade: 5, softFocus: 12,
    microContrast: 28, highlightRolloff: 42,
    portraitGlow: 24,
    tintOverlay: 'rgba(252, 250, 244, 0.04)',
    splitToneShadowHue: 222, splitToneHighlightHue: 36 },

  // Hasselblad Landscape — outdoor mode: richened midtones, polarized sky, vivid greens
  { id: 'hassy_landscape', name: 'Landscape', category: 'Hasselblad',
    css: 'contrast(1.10) saturate(1.20) hue-rotate(2deg) brightness(0.99)',
    grain: 4, vignette: 20, fade: 2,
    microContrast: 38, highlightRolloff: 22,
    splitToneShadowHue: 205, splitToneHighlightHue: 40 },

  // Hasselblad X2D 100C — 100MP medium format: extreme resolving, neutral, clinical
  { id: 'hassy_x2d', name: 'X2D 100C', category: 'Hasselblad',
    css: 'contrast(1.05) saturate(1.04) brightness(1.01)',
    grain: 2, vignette: 8, fade: 2,
    microContrast: 36, highlightRolloff: 36,
    splitToneShadowHue: 218, splitToneHighlightHue: 30,
    tintOverlay: 'rgba(250, 250, 252, 0.02)' },

  // Hasselblad 503CW Studio — classic medium format studio: balanced, timeless, beautiful
  { id: 'hassy_studio', name: '503CW Studio', category: 'Hasselblad',
    css: 'contrast(1.06) saturate(0.96) brightness(1.04)',
    grain: 3, vignette: 6, fade: 2,
    microContrast: 34, highlightRolloff: 44,
    splitToneShadowHue: 222, splitToneHighlightHue: 30 },

  // Hasselblad Monochrome — CFV 100C achromatic digital back, brutal resolution
  { id: 'hassy_mono', name: 'Monochrome', category: 'Hasselblad',
    css: 'grayscale(1) contrast(1.10) brightness(1.03)',
    grain: 4, vignette: 10, fade: 3,
    microContrast: 44, highlightRolloff: 32 },

  // Hasselblad Chrome — rich colour, slight cool shadow, film-like rendering
  { id: 'hassy_chrome', name: 'Chrome', category: 'Hasselblad',
    css: 'contrast(1.12) saturate(1.10) brightness(0.99) hue-rotate(-2deg)',
    grain: 5, vignette: 14, fade: 3,
    microContrast: 40, highlightRolloff: 26,
    splitToneShadowHue: 220, splitToneHighlightHue: 30,
    shadowTint: 'rgba(28, 38, 88, 0.05)' },

];
