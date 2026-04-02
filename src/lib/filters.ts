export type FilterCategory = 'Leica' | 'Film' | 'Hasselblad';

export type Filter = {
  id: string;
  name: string;
  category: FilterCategory;
  css: string;
  // Per-channel linear-light RGB multipliers [r, g, b] applied before Oklab.
  // Leica: Red 1.08-1.12, Green 0.96-0.98, Blue 0.88-0.94 (shadow zone).
  // Applied at 50% strength in shadows, 20% in highlights for natural look.
  rgbMatrix?: [number, number, number];
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

  // ─── STANDARD (no-op) ────────────────────────────────────────────────────────
  { id: 'standard', name: 'Original', category: 'Leica', css: 'none' },


  // ═══════════════════════════════════════════════════════════════════════════
  // LEICA
  //
  // Based on measured Leica color science data:
  //   • M9 CCD:   ~4500K, tint 0, cyan shadows, "Leica Red" punch
  //   • M10/M11:  ~5050–5250K, tint +15/+16 magenta, warm amber shadows
  //   • SL2:      ~5200K, tint +20, flattest files, ARRI-like skin
  //   • Q3:       ~6800K, tint +46, extreme magenta push
  //
  // RGB channel bias (consensus from source data):
  //   Red:   ×1.08–1.12  (boosted — "Leica Red")
  //   Green: ×0.96–0.98  (slightly suppressed)
  //   Blue:  ×0.88–0.94  (suppressed in shadows esp.)
  //
  // Shadow tint per model:
  //   M9: cool cyan-blue (splitTone ~210°)
  //   M10+: warm amber   (splitTone ~28–34°)
  //   SL2: warm-neutral  (splitTone ~30°, milder)
  //
  // Highlight rolloff: gentle shoulder — highlights desaturate before clip
  // Micro-contrast:    local tonal separation (Laplacian sharpening)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Leica Authentic ─────────────────────────────────────────────────────────
  // Xiaomi×Leica "Authentic" profile: Leica-designed, restrained, documentary.
  // Based on: warm CMOS rendering (M10 5250K, +15 tint), retained Summilux
  // vignette, muted saturation, natural skin tones, strong micro-contrast.
  // CSS: contrast ×1.16, brightness ×0.97, sepia 14% (warm), sat ×1.05
  { id: 'leica_authentic', name: 'Authentic', category: 'Leica',
    css: 'contrast(1.16) brightness(0.97) sepia(0.14) saturate(1.05)',
    // M10/M11 RGB matrix: Red ×1.10, Green ×0.97, Blue ×0.91 (warm amber)
    rgbMatrix: [1.10, 0.97, 0.91],
    grain: 6, vignette: 28, fade: 4,
    microContrast: 58, highlightRolloff: 42,
    tintOverlay: 'rgba(255, 245, 228, 0.06)',
    shadowTint: 'rgba(42, 22, 0, 0.08)',
    splitToneShadowHue: 30, splitToneHighlightHue: 38 },

  // ── Leica Vibrant ────────────────────────────────────────────────────────────
  // Xiaomi×Leica "Vibrant" profile: jointly developed, punchy without neon.
  // Sat ×1.40 (Leica Vibrant documented), lower overall contrast than Authentic,
  // higher color purity, no retained vignette, deeper skies.
  // CSS: contrast ×1.10, brightness ×1.02, sepia 8%, sat ×1.40
  { id: 'leica_vibrant', name: 'Vibrant', category: 'Leica',
    css: 'contrast(1.10) brightness(1.02) sepia(0.08) saturate(1.40)',
    // Vibrant: reds punchy, blues slightly elevated (skies deeper)
    rgbMatrix: [1.08, 0.97, 0.95],
    grain: 4, vignette: 10, fade: 2,
    microContrast: 50, highlightRolloff: 28,
    tintOverlay: 'rgba(255, 240, 215, 0.05)',
    splitToneShadowHue: 26, splitToneHighlightHue: 36 },

  // ── Leica M Classic (M9 CCD) ─────────────────────────────────────────────────
  // The legendary M9 CCD look: ~4500K (cooler), tint ~0 (no magenta), cyan-blue
  // shadows, "Leica Red" punch (Kodak KAF-18500 Bayer), muted greens.
  // This is what photographers actually mean by "the Leica CCD look."
  // CSS: negative hue-rotate (-4deg) pushes reds toward punchier cool-warm;
  // slight sepia (8%) for warmth without going orange; sat ×1.15.
  { id: 'leica_m_classic', name: 'M Classic', category: 'Leica',
    css: 'contrast(1.12) brightness(1.00) sepia(0.08) saturate(1.15) hue-rotate(-4deg)',
    // M9 CCD: "Leica Red" punch (KAF-18500 Bayer), cyan-blue shadows
    // Red ×1.12 (Kodak KAF Bayer red response), Blue slightly elevated for CCD cyan character
    rgbMatrix: [1.12, 0.96, 0.96],
    grain: 12, vignette: 22, fade: 5,
    microContrast: 62, highlightRolloff: 30,
    tintOverlay: 'rgba(220, 232, 255, 0.05)',
    shadowTint: 'rgba(0, 18, 60, 0.10)',
    splitToneShadowHue: 212, splitToneHighlightHue: 36 },

  // ── Leica Summilux ───────────────────────────────────────────────────────────
  // Summilux f/1.4 rendering: warmer/yellower than APO, "painterly" bokeh,
  // radial vignette retained (f/1.4 characteristic), warm color shift ~+50-100K,
  // +2-5 tint magenta direction. Reds boosted, blues slightly muted.
  // CSS: sepia 12% + hue-rotate +4deg (warm magenta direction per M10 5250K data)
  { id: 'leica_summilux', name: 'Summilux', category: 'Leica',
    css: 'contrast(1.20) brightness(1.03) sepia(0.12) saturate(1.14) hue-rotate(4deg)',
    // Summilux: warmer/yellower than APO, reds boosted, blues muted
    rgbMatrix: [1.10, 0.97, 0.90],
    grain: 10, vignette: 38, fade: 7, softFocus: 8,
    microContrast: 48, highlightRolloff: 42,
    tintOverlay: 'rgba(255, 232, 190, 0.08)',
    shadowTint: 'rgba(50, 22, 0, 0.09)',
    splitToneShadowHue: 26, splitToneHighlightHue: 40 },

  // ── Leica APO-Summicron ──────────────────────────────────────────────────────
  // APO-Summicron f/2: "the whitest Leica lens", cooler/neutral, near-perfect
  // flat field, exceptional micro-contrast (MTF near-flat across frame),
  // higher global contrast, near-zero CA. No warmth, no vignette character.
  // CSS: no sepia, no hue-rotate, pure contrast + micro-contrast emphasis.
  { id: 'leica_apo', name: 'APO', category: 'Leica',
    css: 'contrast(1.26) brightness(1.01) saturate(0.96)',
    // APO: "whitest Leica lens" — near-neutral matrix, very slight red lift
    rgbMatrix: [1.04, 0.99, 0.98],
    grain: 3, vignette: 8, fade: 2,
    microContrast: 78, highlightRolloff: 44,
    shadowTint: 'rgba(20, 30, 80, 0.06)',
    splitToneShadowHue: 216, splitToneHighlightHue: 24 },

  // ── Leica Noctilux ───────────────────────────────────────────────────────────
  // Noctilux f/0.95: "Mandler Glow" — luminous halo around bright edges,
  // deep atmospheric shadows, cinematic depth, strong vignette at wide aperture.
  // Warm overall; rapid focus fall-off; bokeh neutral round blobs.
  // CSS: contrast 1.22, brightness 0.94 (moody), sepia 10%, sat 1.08
  { id: 'leica_noctilux', name: 'Noctilux', category: 'Leica',
    css: 'contrast(1.22) brightness(0.94) sepia(0.10) saturate(1.08)',
    // Noctilux: warm, atmospheric — moderate red lift, blue strongly suppressed
    rgbMatrix: [1.08, 0.96, 0.88],
    grain: 22, vignette: 62, fade: 8, halation: 44, bloom: 32, softFocus: 14,
    microContrast: 36, highlightRolloff: 55,
    tintOverlay: 'rgba(245, 220, 185, 0.07)',
    shadowTint: 'rgba(16, 22, 65, 0.16)',
    splitToneShadowHue: 228, splitToneHighlightHue: 28 },

  // ── Leica SL2 ────────────────────────────────────────────────────────────────
  // SL2: 5200K, tint +20 (warmest magenta in the lineup), "ARRI-like" skin,
  // flattest files (open shadows, protected highlights), best straight-OOC skin.
  // Less "M series pop" — modern/clinical rendering. Strong +20 tint = hue-rotate
  // toward magenta (+6deg). Reds slightly oversaturated vs other Leicas.
  { id: 'leica_sl2', name: 'SL2', category: 'Leica',
    css: 'contrast(1.08) brightness(1.04) sepia(0.12) saturate(1.18) hue-rotate(6deg)',
    // SL2: warm-magenta (+20 tint) — red slightly high, blue suppressed, green natural
    rgbMatrix: [1.09, 0.97, 0.92],
    grain: 3, vignette: 14, fade: 2,
    microContrast: 44, highlightRolloff: 40,
    tintOverlay: 'rgba(255, 242, 235, 0.06)',
    shadowTint: 'rgba(50, 18, 20, 0.07)',
    splitToneShadowHue: 20, splitToneHighlightHue: 30 },

  // ── Leica Monochrom ──────────────────────────────────────────────────────────
  // Dedicated B&W sensor: no Bayer filter = ~1.4 stops extra DR per pixel.
  // Rendering: open shadows (blacks lifted +3–5), protected highlights (whites ~248),
  // film-like midtone gradation. ISO 800 = near-zero noise; above = Tri-X-like grain.
  // S-curve: slight midtone lift, strong highlight protection.
  { id: 'leica_monochrom', name: 'Monochrom', category: 'Leica',
    css: 'grayscale(1) contrast(1.15) brightness(0.99)',
    grain: 28, vignette: 26, fade: 4,
    // Highest micro-contrast — dedicated luminance sensor
    microContrast: 72, highlightRolloff: 30 },

  // ── Leica Q3 ─────────────────────────────────────────────────────────────────
  // Q3: extreme magenta tint (+46 — anomalously high, likely CFA quirk).
  // Warm-shifted, extremely saturated color rendition. 28mm Summilux compact.
  // The +46 tint shows as a pinkish-magenta cast in warm light.
  // CSS: strong sepia + hue-rotate toward magenta-pink (+8deg)
  { id: 'leica_q3', name: 'Q3', category: 'Leica',
    css: 'contrast(1.24) brightness(1.02) sepia(0.18) saturate(1.22) hue-rotate(8deg)',
    // Q3: extreme +46 tint = strong red/magenta, suppressed blue-green
    rgbMatrix: [1.12, 0.95, 0.89],
    grain: 5, vignette: 26, fade: 3,
    microContrast: 52, highlightRolloff: 32,
    tintOverlay: 'rgba(255, 235, 225, 0.08)',
    shadowTint: 'rgba(55, 15, 25, 0.09)',
    splitToneShadowHue: 16, splitToneHighlightHue: 34 },

  // ── Leica Portrait ───────────────────────────────────────────────────────────
  // Leica Contemporary / Portrait color: "subtle reddish tint, soft natural skin".
  // Red channel +8–12 sat, +3–5 hue toward warm. Blue -8–12 sat.
  // Green muted → warmer skin. Warm amber shadows on skin.
  // Soft focus + portrait glow for the "Leica skin rendering" quality.
  { id: 'leica_portrait', name: 'Portrait', category: 'Leica',
    css: 'contrast(1.06) brightness(1.08) sepia(0.10) saturate(1.18) hue-rotate(5deg)',
    // Portrait: "Leica Contemporary" — red ×1.11, green muted, blue suppressed
    // This creates the warm reddish skin tone Leica is known for
    rgbMatrix: [1.11, 0.96, 0.90],
    grain: 5, vignette: 30, fade: 8, softFocus: 18,
    microContrast: 30, highlightRolloff: 58,
    portraitGlow: 42,
    tintOverlay: 'rgba(255, 236, 212, 0.10)',
    shadowTint: 'rgba(48, 16, 8, 0.08)',
    splitToneShadowHue: 22, splitToneHighlightHue: 38 },


  // ═══════════════════════════════════════════════════════════════════════════
  // FILM
  // ═══════════════════════════════════════════════════════════════════════════

  { id: 'portra_160', name: 'Portra 160', category: 'Film',
    css: 'sepia(0.10) contrast(0.94) saturate(1.16) hue-rotate(-4deg) brightness(1.06)',
    grain: 10, vignette: 14, fade: 7,
    microContrast: 14, highlightRolloff: 24,
    tintOverlay: 'rgba(255, 232, 205, 0.08)',
    splitToneShadowHue: 28, splitToneHighlightHue: 44 },

  { id: 'portra_400', name: 'Portra 400', category: 'Film',
    css: 'sepia(0.14) contrast(0.96) saturate(1.20) hue-rotate(-5deg) brightness(1.07)',
    grain: 26, vignette: 18, fade: 9,
    microContrast: 16, highlightRolloff: 26,
    tintOverlay: 'rgba(255, 224, 196, 0.09)',
    splitToneShadowHue: 26, splitToneHighlightHue: 42 },

  { id: 'portra_800', name: 'Portra 800', category: 'Film',
    css: 'sepia(0.16) contrast(1.00) saturate(1.22) hue-rotate(-6deg) brightness(1.05)',
    grain: 42, vignette: 22, fade: 10,
    microContrast: 18, highlightRolloff: 28,
    tintOverlay: 'rgba(255, 216, 188, 0.10)',
    splitToneShadowHue: 315, splitToneHighlightHue: 38 },

  { id: 'fuji_pro_400h', name: 'Pro 400H', category: 'Film',
    css: 'sepia(0.03) contrast(0.94) saturate(1.12) hue-rotate(12deg) brightness(1.09)',
    grain: 20, vignette: 14, fade: 6,
    microContrast: 12, highlightRolloff: 20,
    tintOverlay: 'rgba(200, 232, 215, 0.08)',
    splitToneShadowHue: 162, splitToneHighlightHue: 46 },

  { id: 'superia_400', name: 'Superia 400', category: 'Film',
    css: 'contrast(1.16) saturate(1.38) hue-rotate(7deg) sepia(0.08) brightness(0.99)',
    grain: 34, vignette: 24, fade: 5,
    microContrast: 20,
    splitToneShadowHue: 148, splitToneHighlightHue: 34 },

  { id: 'cinestill_800t', name: 'CineStill 800T', category: 'Film',
    css: 'sepia(0.05) contrast(1.18) saturate(1.26) hue-rotate(-14deg) brightness(1.04)',
    grain: 48, vignette: 30, lightLeak: 10, halation: 46, fade: 9,
    microContrast: 24, highlightRolloff: 26,
    tintOverlay: 'rgba(155, 200, 238, 0.09)',
    splitToneShadowHue: 198, splitToneHighlightHue: -14 },

  { id: 'cinestill_50d', name: 'CineStill 50D', category: 'Film',
    css: 'contrast(1.10) saturate(1.20) hue-rotate(-2deg) sepia(0.05) brightness(1.05)',
    grain: 12, vignette: 18, halation: 18, fade: 4,
    microContrast: 22, highlightRolloff: 24 },

  { id: 'velvia_50', name: 'Velvia 50', category: 'Film',
    css: 'contrast(1.42) saturate(1.68) hue-rotate(-4deg) brightness(0.95)',
    grain: 8, vignette: 30, fade: 2,
    microContrast: 30, highlightRolloff: 10 },

  { id: 'provia_100f', name: 'Provia 100F', category: 'Film',
    css: 'contrast(1.18) saturate(1.28) hue-rotate(2deg) brightness(1.04)',
    grain: 10, vignette: 16, fade: 3,
    microContrast: 22, highlightRolloff: 18 },

  { id: 'kodachrome', name: 'Kodachrome', category: 'Film',
    css: 'sepia(0.18) contrast(1.28) saturate(1.32) hue-rotate(-12deg) brightness(0.97)',
    grain: 20, vignette: 32, dust: 8, fade: 8,
    microContrast: 28, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 205, 165, 0.10)',
    splitToneShadowHue: -10, splitToneHighlightHue: 32 },

  { id: 'ektar_100', name: 'Ektar 100', category: 'Film',
    css: 'contrast(1.22) saturate(1.58) hue-rotate(2deg) brightness(1.03)',
    grain: 7, vignette: 20, fade: 2,
    microContrast: 24, highlightRolloff: 14 },

  { id: 'gold_200', name: 'Gold 200', category: 'Film',
    css: 'sepia(0.24) contrast(1.08) saturate(1.26) hue-rotate(-16deg) brightness(1.08)',
    grain: 32, vignette: 24, lightLeak: 8, fade: 10,
    microContrast: 14, highlightRolloff: 20,
    tintOverlay: 'rgba(255, 224, 160, 0.11)',
    splitToneShadowHue: 24, splitToneHighlightHue: 48 },

  { id: 'colorplus_200', name: 'ColorPlus 200', category: 'Film',
    css: 'sepia(0.28) contrast(1.04) saturate(1.18) hue-rotate(-8deg) brightness(1.06)',
    grain: 46, vignette: 30, dust: 8, fade: 13,
    microContrast: 10, highlightRolloff: 18,
    tintOverlay: 'rgba(255, 222, 172, 0.11)' },

  { id: 'lomo_400', name: 'Lomo 400', category: 'Film',
    css: 'sepia(0.08) contrast(1.38) saturate(1.55) hue-rotate(14deg) brightness(1.03)',
    grain: 52, vignette: 50, lightLeak: 38, dust: 18, fade: 5,
    microContrast: 26 },

  { id: 'agfa_vista', name: 'Agfa Vista', category: 'Film',
    css: 'contrast(1.15) saturate(1.40) hue-rotate(8deg) sepia(0.04) brightness(1.02)',
    grain: 30, vignette: 24, fade: 5,
    microContrast: 20,
    splitToneShadowHue: 172, splitToneHighlightHue: 34 },

  { id: 'polaroid_600', name: 'Polaroid 600', category: 'Film',
    css: 'sepia(0.16) contrast(0.86) saturate(1.08) hue-rotate(-5deg) brightness(1.12)',
    grain: 32, vignette: 50, lightLeak: 22, dust: 26, fade: 18,
    highlightRolloff: 26,
    tintOverlay: 'rgba(240, 234, 208, 0.11)',
    splitToneShadowHue: 54, splitToneHighlightHue: 46 },

  { id: 'ilford_hp5', name: 'Ilford HP5', category: 'Film',
    css: 'grayscale(1) contrast(1.20) brightness(1.05)',
    grain: 40, vignette: 20, fade: 5,
    microContrast: 24, highlightRolloff: 18 },

  { id: 'ilford_fp4', name: 'Ilford FP4', category: 'Film',
    css: 'grayscale(1) contrast(1.14) brightness(1.05)',
    grain: 18, vignette: 16, fade: 3,
    microContrast: 20, highlightRolloff: 20 },

  { id: 'ilford_delta', name: 'Delta 3200', category: 'Film',
    css: 'grayscale(1) contrast(1.36) brightness(1.05)',
    grain: 60, vignette: 28, fade: 3,
    microContrast: 28, highlightRolloff: 8 },

  { id: 'tri_x_400', name: 'Tri-X 400', category: 'Film',
    css: 'grayscale(1) contrast(1.40) brightness(0.96)',
    grain: 56, vignette: 30, fade: 4,
    microContrast: 30, highlightRolloff: 8 },

  { id: 'tmax_400', name: 'T-Max 400', category: 'Film',
    css: 'grayscale(1) contrast(1.22) brightness(1.04)',
    grain: 28, vignette: 20, fade: 3,
    microContrast: 26, highlightRolloff: 20 },

  { id: 'neopan_100', name: 'Neopan 100', category: 'Film',
    css: 'grayscale(1) contrast(1.15) brightness(1.07)',
    grain: 12, vignette: 14, fade: 2,
    microContrast: 20, highlightRolloff: 18 },


  // ═══════════════════════════════════════════════════════════════════════════
  // HASSELBLAD
  // ═══════════════════════════════════════════════════════════════════════════

  { id: 'hassy_natural', name: 'Natural', category: 'Hasselblad',
    css: 'contrast(1.08) saturate(1.04) brightness(1.02)',
    rgbMatrix: [0.98, 1.02, 1.02],
    grain: 3, vignette: 10, fade: 3,
    microContrast: 36, highlightRolloff: 38,
    tintOverlay: 'rgba(248, 250, 252, 0.03)',
    splitToneShadowHue: 230, splitToneHighlightHue: 34 },

  { id: 'hassy_portrait', name: 'Portrait', category: 'Hasselblad',
    css: 'contrast(1.02) saturate(1.10) brightness(1.06) sepia(0.06)',
    rgbMatrix: [1.08, 0.98, 0.92],
    grain: 4, vignette: 18, fade: 5, softFocus: 18,
    microContrast: 24, highlightRolloff: 55,
    portraitGlow: 45,
    tintOverlay: 'rgba(255, 242, 230, 0.06)',
    splitToneShadowHue: 28, splitToneHighlightHue: 40 },

  { id: 'hassy_landscape', name: 'Landscape', category: 'Hasselblad',
    css: 'contrast(1.22) saturate(1.35) hue-rotate(3deg) brightness(0.98)',
    rgbMatrix: [0.94, 1.06, 1.04],
    grain: 2, vignette: 28, fade: 2,
    microContrast: 52, highlightRolloff: 20,
    splitToneShadowHue: 206, splitToneHighlightHue: 44 },

  { id: 'hassy_x2d', name: 'X2D 100C', category: 'Hasselblad',
    css: 'contrast(1.15) saturate(1.12) brightness(1.04)',
    rgbMatrix: [1.02, 1.0, 1.04],
    grain: 1, vignette: 12, fade: 0,
    microContrast: 65, highlightRolloff: 35,
    splitToneShadowHue: 220, splitToneHighlightHue: 32,
    tintOverlay: 'rgba(250, 250, 252, 0.02)' },

  { id: 'hassy_studio', name: '503CW Studio', category: 'Hasselblad',
    css: 'contrast(1.04) saturate(0.96) brightness(1.08)',
    rgbMatrix: [1.0, 1.0, 1.0],
    grain: 4, vignette: 6, fade: 2,
    microContrast: 30, highlightRolloff: 60,
    splitToneShadowHue: 224, splitToneHighlightHue: 32 },

  { id: 'hassy_mono', name: 'Monochrome', category: 'Hasselblad',
    css: 'grayscale(1) contrast(1.20) brightness(1.04)',
    rgbMatrix: [1.0, 1.0, 1.0],
    grain: 6, vignette: 16, fade: 3,
    microContrast: 55, highlightRolloff: 30 },

  { id: 'hassy_chrome', name: 'Chrome', category: 'Hasselblad',
    css: 'contrast(1.25) saturate(1.20) brightness(0.96) hue-rotate(-3deg) sepia(0.04)',
    rgbMatrix: [1.05, 0.96, 0.94],
    grain: 8, vignette: 22, fade: 4,
    microContrast: 48, highlightRolloff: 25,
    splitToneShadowHue: 215, splitToneHighlightHue: 35,
    shadowTint: 'rgba(15, 25, 75, 0.12)' },

];
