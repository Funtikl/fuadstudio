export type FilterCategory = 'Essentials' | 'Cinematic' | 'Film' | 'Vintage' | 'B&W' | 'Creative' | 'Magic';

export type Filter = {
  id: string;
  name: string;
  category: FilterCategory;
  css: string;
  grain?: number;
  vignette?: number;
  lightLeak?: number;
  dust?: number;
  halation?: number;
  fade?: number;                 // shadow lift — film base fog
  bloom?: number;                // highlight glow
  tintOverlay?: string;         // subtle global color cast, e.g. 'rgba(255,230,200,0.08)'
  shadowTint?: string;          // color tint applied to shadows via multiply blend
  burnEdges?: number;           // aggressive colour-burn edge darkening (0–100)
  chromaticAberration?: number; // RGB lens fringing strength (0–100)
  softFocus?: number;           // dreamy soft focus glow (0–100)
  filmBurn?: number;            // bottom-right warm light leak (0–100)
  scanLines?: number;           // VHS/CRT horizontal scan lines (0–100)
};

export const FILTERS: Filter[] = [
  // Essentials
  { id: 'standard', name: 'Standard', category: 'Essentials', css: 'none' },
  { id: 'vivid', name: 'Vivid', category: 'Essentials', css: 'contrast(1.1) saturate(1.3)' },
  { id: 'muted', name: 'Muted', category: 'Essentials', css: 'contrast(0.9) saturate(0.7)' },
  { id: 'bright', name: 'Bright', category: 'Essentials', css: 'brightness(1.15) contrast(1.05)' },
  { id: 'dark', name: 'Dark', category: 'Essentials', css: 'brightness(0.85) contrast(1.1)' },

  // Cinematic
  { id: 'teal_orange', name: 'Teal & Orange', category: 'Cinematic', css: 'contrast(1.15) saturate(1.25) hue-rotate(-12deg) sepia(0.15) brightness(1.02)', vignette: 20 },
  { id: 'moody', name: 'Moody', category: 'Cinematic', css: 'brightness(0.82) contrast(1.25) saturate(0.85) sepia(0.05)', vignette: 30, grain: 8 },
  { id: 'cyberpunk', name: 'Cyberpunk', category: 'Cinematic', css: 'contrast(1.3) saturate(1.5) hue-rotate(30deg) brightness(0.9)', vignette: 15 },
  { id: 'matrix', name: 'Matrix', category: 'Cinematic', css: 'contrast(1.2) saturate(1.2) hue-rotate(90deg) brightness(0.9)' },

  // Film — refined color science for each stock

  // Kodak Portra: soft pastels, lifted shadows, warm skin tones, low contrast, base fog
  { id: 'portra_160', name: 'Portra 160', category: 'Film',
    css: 'sepia(0.06) contrast(0.91) saturate(1.08) hue-rotate(-3deg) brightness(1.04)',
    grain: 12, vignette: 8, fade: 4,
    tintOverlay: 'rgba(255, 235, 210, 0.06)' },
  { id: 'portra_400', name: 'Portra 400', category: 'Film',
    css: 'sepia(0.10) contrast(0.94) saturate(1.12) hue-rotate(-4deg) brightness(1.06)',
    grain: 22, vignette: 12, fade: 5,
    tintOverlay: 'rgba(255, 230, 205, 0.07)' },
  { id: 'portra_800', name: 'Portra 800', category: 'Film',
    css: 'sepia(0.13) contrast(0.98) saturate(1.15) hue-rotate(-5deg) brightness(1.04)',
    grain: 38, vignette: 18, fade: 6,
    tintOverlay: 'rgba(255, 225, 200, 0.08)' },

  // Fuji Pro 400H: cool greens in shadows, soft, pastel, slightly underexposed look
  { id: 'fuji_pro_400h', name: 'Fuji Pro 400H', category: 'Film',
    css: 'sepia(0.03) contrast(0.92) saturate(1.04) hue-rotate(9deg) brightness(1.07)',
    grain: 18, vignette: 8, fade: 3,
    tintOverlay: 'rgba(205, 235, 218, 0.06)' },

  // Fuji Superia: punchy consumer film, green-shifted shadows, warm highlights
  { id: 'superia_400', name: 'Superia 400', category: 'Film',
    css: 'contrast(1.12) saturate(1.3) hue-rotate(6deg) sepia(0.06) brightness(0.98)',
    grain: 32, vignette: 22, fade: 4 },

  // CineStill 800T: tungsten-balanced, heavy halation, teal shadows, warm highlights
  { id: 'cinestill_800t', name: 'CineStill 800T', category: 'Film',
    css: 'sepia(0.04) contrast(1.15) saturate(1.2) hue-rotate(-12deg) brightness(1.03)',
    grain: 42, vignette: 25, lightLeak: 10, halation: 35, fade: 6,
    tintOverlay: 'rgba(180, 215, 240, 0.07)' },

  // CineStill 50D: daylight-balanced cinema film, neutral tones, fine grain
  { id: 'cinestill_50d', name: 'CineStill 50D', category: 'Film',
    css: 'contrast(1.08) saturate(1.18) hue-rotate(-3deg) sepia(0.06) brightness(1.04)',
    grain: 10, vignette: 15, halation: 15, fade: 3 },

  // Fuji Velvia 50: legendary slide film, ultra-saturated, deep blacks
  { id: 'velvia_50', name: 'Velvia 50', category: 'Film',
    css: 'contrast(1.35) saturate(1.55) hue-rotate(-3deg) brightness(0.96)',
    grain: 8, vignette: 28, fade: 2 },

  // Fuji Provia 100F: balanced slide film, accurate colors, slight saturation boost
  { id: 'provia_100f', name: 'Provia 100F', category: 'Film',
    css: 'contrast(1.18) saturate(1.25) hue-rotate(3deg) brightness(1.03)',
    grain: 10, vignette: 12, fade: 3 },

  // Kodachrome: legendary warm tones, deep reds, punchy, classic look
  { id: 'kodachrome', name: 'Kodachrome', category: 'Film',
    css: 'sepia(0.13) contrast(1.25) saturate(1.22) hue-rotate(-9deg) brightness(0.97)',
    grain: 18, vignette: 30, dust: 8, fade: 6,
    tintOverlay: 'rgba(255, 210, 178, 0.08)' },

  // Kodak Ektar 100: ultra-saturated negative film, vivid reds and blues
  { id: 'ektar_100', name: 'Ektar 100', category: 'Film',
    css: 'contrast(1.18) saturate(1.5) hue-rotate(3deg) brightness(1.01)',
    grain: 8, vignette: 18, fade: 2 },

  // Kodak Gold 200: warm consumer film, golden tones, nostalgic
  { id: 'gold_200', name: 'Gold 200', category: 'Film',
    css: 'sepia(0.20) contrast(1.08) saturate(1.22) hue-rotate(-13deg) brightness(1.06)',
    grain: 30, vignette: 22, lightLeak: 8, fade: 7,
    tintOverlay: 'rgba(255, 230, 175, 0.10)' },

  // Kodak ColorPlus 200: budget warm film, heavy grain, muted but warm
  { id: 'colorplus_200', name: 'ColorPlus 200', category: 'Film',
    css: 'sepia(0.24) contrast(1.04) saturate(1.14) hue-rotate(-8deg) brightness(1.03)',
    grain: 42, vignette: 28, dust: 5, fade: 9,
    tintOverlay: 'rgba(255, 225, 183, 0.09)' },

  // Lomography 400: cross-processed, heavy vignette, saturated, unpredictable
  { id: 'lomo_400', name: 'Lomo 400', category: 'Film',
    css: 'sepia(0.08) contrast(1.3) saturate(1.45) hue-rotate(12deg) brightness(1.03)',
    grain: 48, vignette: 45, lightLeak: 35, dust: 15, fade: 5 },

  // Agfa Vista: bold greens and blues, moderate grain
  { id: 'agfa_vista', name: 'Agfa Vista', category: 'Film',
    css: 'contrast(1.12) saturate(1.35) hue-rotate(8deg) sepia(0.04) brightness(1.0)',
    grain: 28, vignette: 22, fade: 4 },

  // Polaroid 600: instant film, faded, low contrast, slight color cast, heavy vignette
  { id: 'polaroid_600', name: 'Polaroid 600', category: 'Film',
    css: 'sepia(0.12) contrast(0.86) saturate(1.05) hue-rotate(-4deg) brightness(1.08)',
    grain: 30, vignette: 45, lightLeak: 20, dust: 25, fade: 12,
    tintOverlay: 'rgba(240, 235, 210, 0.10)' },

  // B&W Film stocks
  { id: 'ilford_hp5', name: 'Ilford HP5', category: 'Film',
    css: 'grayscale(1) contrast(1.12) brightness(1.04)',
    grain: 38, vignette: 18, fade: 3 },
  { id: 'ilford_fp4', name: 'Ilford FP4', category: 'Film',
    css: 'grayscale(1) contrast(1.08) brightness(1.03)',
    grain: 18, vignette: 12, fade: 2 },
  { id: 'ilford_delta', name: 'Ilford Delta', category: 'Film',
    css: 'grayscale(1) contrast(1.25) brightness(1.08)',
    grain: 22, vignette: 22, fade: 2 },
  { id: 'tri_x_400', name: 'Tri-X 400', category: 'Film',
    css: 'grayscale(1) contrast(1.35) brightness(0.96)',
    grain: 52, vignette: 28, fade: 4 },
  { id: 'tmax_400', name: 'T-Max 400', category: 'Film',
    css: 'grayscale(1) contrast(1.18) brightness(1.02)',
    grain: 28, vignette: 18, fade: 2 },
  { id: 'neopan_100', name: 'Neopan 100', category: 'Film',
    css: 'grayscale(1) contrast(1.12) brightness(1.06)',
    grain: 12, vignette: 12, fade: 2 },

  // Vintage
  { id: 'retro', name: 'Retro', category: 'Vintage', css: 'contrast(0.85) saturate(0.8) sepia(0.4) hue-rotate(-10deg)', grain: 20, vignette: 15 },
  { id: '1970s', name: '1970s', category: 'Vintage', css: 'contrast(0.9) saturate(0.7) sepia(0.6)', grain: 25, vignette: 20 },
  { id: 'polaroid', name: 'Polaroid', category: 'Vintage', css: 'contrast(1.1) saturate(1.2) sepia(0.3) brightness(1.1)', grain: 15, vignette: 35 },
  { id: 'sepia_classic', name: 'Sepia', category: 'Vintage', css: 'sepia(1) contrast(0.9)', grain: 30, dust: 15 },
  { id: 'faded', name: 'Faded', category: 'Vintage', css: 'contrast(0.7) brightness(1.1) saturate(0.8)', grain: 15, vignette: 10 },

  // B&W
  { id: 'classic_bw', name: 'Classic B&W', category: 'B&W', css: 'grayscale(1)', grain: 10 },
  { id: 'noir', name: 'Noir', category: 'B&W', css: 'grayscale(1) contrast(1.5) brightness(0.9)', grain: 15, vignette: 40 },
  { id: 'high_contrast', name: 'High Contrast', category: 'B&W', css: 'grayscale(1) contrast(1.3)' },
  { id: 'washed_bw', name: 'Washed', category: 'B&W', css: 'grayscale(1) contrast(0.7) brightness(1.2)' },
  { id: 'silver', name: 'Silver', category: 'B&W', css: 'grayscale(1) contrast(1.1) brightness(1.1)', grain: 8 },

  // Creative
  { id: 'dreamy', name: 'Dreamy', category: 'Creative', css: 'blur(1px) contrast(0.9) brightness(1.1) saturate(1.2)' },
  { id: 'invert', name: 'Invert', category: 'Creative', css: 'invert(1) hue-rotate(180deg)' },
  { id: 'neon', name: 'Neon', category: 'Creative', css: 'contrast(1.5) saturate(2) hue-rotate(45deg)' },
  { id: 'thermal', name: 'Thermal', category: 'Creative', css: 'invert(1) hue-rotate(270deg) saturate(3) contrast(1.5)' },
  { id: 'duotone', name: 'Duotone', category: 'Creative', css: 'grayscale(1) sepia(1) hue-rotate(200deg) saturate(3) contrast(1.2)' },

  // Magic — maximum impact, beautiful presets
  { id: 'golden_hour', name: 'Golden Hour', category: 'Magic',
    css: 'sepia(0.48) contrast(1.25) saturate(1.7) hue-rotate(-24deg) brightness(1.20)',
    grain: 24, vignette: 42, lightLeak: 58, fade: 10, halation: 35,
    chromaticAberration: 18, softFocus: 18, filmBurn: 25,
    shadowTint: 'rgba(160, 60, 0, 0.28)',
    burnEdges: 28,
    tintOverlay: 'rgba(255, 130, 20, 0.24)' },

  { id: 'velvet', name: 'Velvet', category: 'Magic',
    css: 'contrast(0.62) saturate(0.50) brightness(1.22) sepia(0.20)',
    grain: 22, vignette: 22, fade: 32, bloom: 45, softFocus: 35,
    shadowTint: 'rgba(185, 130, 200, 0.22)',
    burnEdges: 22,
    tintOverlay: 'rgba(255, 190, 240, 0.22)' },

  { id: 'celestial', name: 'Celestial', category: 'Magic',
    css: 'contrast(1.38) saturate(1.72) hue-rotate(28deg) brightness(1.20)',
    grain: 16, vignette: 45, bloom: 48, halation: 28,
    chromaticAberration: 28, softFocus: 12,
    shadowTint: 'rgba(20, 40, 200, 0.32)',
    burnEdges: 40,
    tintOverlay: 'rgba(90, 140, 255, 0.26)' },

  { id: 'rose_gold', name: 'Rose Gold', category: 'Magic',
    css: 'sepia(0.35) contrast(1.14) saturate(1.68) hue-rotate(-35deg) brightness(1.14)',
    grain: 18, vignette: 35, lightLeak: 28, fade: 12, softFocus: 14, filmBurn: 15,
    chromaticAberration: 15,
    shadowTint: 'rgba(190, 60, 90, 0.26)',
    burnEdges: 28,
    tintOverlay: 'rgba(255, 110, 125, 0.24)' },

  { id: 'dusk', name: 'Dusk', category: 'Magic',
    css: 'sepia(0.10) contrast(1.58) saturate(0.60) hue-rotate(35deg) brightness(0.78)',
    grain: 48, vignette: 62, fade: 6, scanLines: 10,
    chromaticAberration: 12,
    shadowTint: 'rgba(50, 20, 190, 0.35)',
    burnEdges: 50,
    tintOverlay: 'rgba(70, 50, 210, 0.26)' },
];
