import { Adjustments } from '../types';
import { Filter } from './filters';

// ─── Core utilities ───────────────────────────────────────────────────────────

const yld = () => new Promise<void>(r => setTimeout(r, 0));
const clamp01 = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;

// ─── sRGB ↔ Linear LUTs (built once) ─────────────────────────────────────────

const TO_LINEAR = new Float32Array(256);
const TO_GAMMA  = new Uint8Array(65536);

(function buildLuts() {
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    TO_LINEAR[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  for (let i = 0; i < 65536; i++) {
    const v = i / 65535;
    const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
    TO_GAMMA[i] = Math.min(255, Math.max(0, Math.round(g * 255)));
  }
})();

const lin2g = (v: number) => TO_GAMMA[(clamp01(v) * 65535 + 0.5) | 0];

// ─── Pre-baked Gaussian noise table ──────────────────────────────────────────

const NTBL = 65536;
const NOISE = new Float32Array(NTBL);
(function() {
  for (let i = 0; i < NTBL; i += 2) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const m = Math.sqrt(-2 * Math.log(u));
    NOISE[i]     = m * Math.cos(2 * Math.PI * v);
    NOISE[i + 1] = m * Math.sin(2 * Math.PI * v);
  }
})();
let _ni = 0;
const fgauss = () => NOISE[_ni = (_ni + 1) & (NTBL - 1)];

// ─── Buffer pool (avoids GC thrash from repeated Float32Array allocations) ───

const _pool: Float32Array[] = [];
function getBuffer(n: number): Float32Array {
  const buf = _pool.pop();
  if (buf && buf.length >= n) { buf.fill(0, 0, n); return buf; }
  return new Float32Array(n);
}
function freeBuffer(buf: Float32Array) { if (_pool.length < 24) _pool.push(buf); }

// ─── Separable box blur (3-pass ≈ Gaussian, using buffer pool) ──────────────

function boxBlurH(s: Float32Array, d: Float32Array, W: number, H: number, r: number) {
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < H; y++) {
    const row = y * W;
    let sum = s[row] * (r + 1);
    for (let x = 1; x <= r; x++) sum += s[row + Math.min(x, W - 1)];
    for (let x = 0; x < W; x++) {
      d[row + x] = sum * inv;
      sum += s[row + Math.min(x + r + 1, W - 1)] - s[row + Math.max(x - r, 0)];
    }
  }
}

function boxBlurV(s: Float32Array, d: Float32Array, W: number, H: number, r: number) {
  const inv = 1 / (2 * r + 1);
  for (let x = 0; x < W; x++) {
    let sum = s[x] * (r + 1);
    for (let y = 1; y <= r; y++) sum += s[Math.min(y, H - 1) * W + x];
    for (let y = 0; y < H; y++) {
      d[y * W + x] = sum * inv;
      sum += s[Math.min(y + r + 1, H - 1) * W + x] - s[Math.max(y - r, 0) * W + x];
    }
  }
}

/** 3-pass box blur ≈ Gaussian. Returns pooled buffer — caller must freeBuffer. */
function blur(src: Float32Array, W: number, H: number, r: number): Float32Array {
  if (r < 1) { const out = getBuffer(W * H); out.set(src.subarray(0, W * H)); return out; }
  const n   = W * H;
  const t   = getBuffer(n);
  const a   = getBuffer(n);
  const b   = getBuffer(n);
  // Pass 1
  boxBlurH(src, t, W, H, r);
  boxBlurV(t, a, W, H, r);
  // Pass 2
  boxBlurH(a, t, W, H, r);
  boxBlurV(t, b, W, H, r);
  // Pass 3
  boxBlurH(b, t, W, H, r);
  boxBlurV(t, a, W, H, r);
  freeBuffer(t); freeBuffer(b);
  return a; // caller frees
}

// ─── Inline Oklab (no tuple allocation — ~3× faster in hot loops) ────────────
//
// Instead of returning [L,a,b], we write into module-scoped vars.
// This eliminates millions of array allocations in per-pixel loops.

let _oL = 0, _oa = 0, _ob = 0;

function rgb8ToOklab(r8: number, g8: number, b8: number) {
  const rl = TO_LINEAR[r8], gl = TO_LINEAR[g8], bl = TO_LINEAR[b8];
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const lc = Math.cbrt(Math.max(0, l));
  const mc = Math.cbrt(Math.max(0, m));
  const sc = Math.cbrt(Math.max(0, s));
  _oL = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  _oa = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  _ob = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;
}

let _r8 = 0, _g8 = 0, _b8 = 0;

function oklabToRgb8(L: number, a: number, b: number) {
  const lc = L + 0.3963377774 * a + 0.2158037573 * b;
  const mc = L - 0.1055613458 * a - 0.0638541728 * b;
  const sc = L - 0.0894841775 * a - 1.2914855480 * b;
  const rl =  4.0767416621 * lc*lc*lc - 3.3077115913 * mc*mc*mc + 0.2309699292 * sc*sc*sc;
  const gl = -1.2684380046 * lc*lc*lc + 2.6097574011 * mc*mc*mc - 0.3413193965 * sc*sc*sc;
  const bl = -0.0041960863 * lc*lc*lc - 0.7034186147 * mc*mc*mc + 1.7076147010 * sc*sc*sc;
  _r8 = lin2g(rl); _g8 = lin2g(gl); _b8 = lin2g(bl);
}

function linRgbToOklab(rl: number, gl: number, bl: number) {
  const l = 0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl;
  const m = 0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl;
  const s = 0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl;
  const lc = Math.cbrt(Math.max(0, l));
  const mc = Math.cbrt(Math.max(0, m));
  const sc = Math.cbrt(Math.max(0, s));
  _oL = 0.2104542553 * lc + 0.7936177850 * mc - 0.0040720468 * sc;
  _oa = 1.9779984951 * lc - 2.4285922050 * mc + 0.4505937099 * sc;
  _ob = 0.0259040371 * lc + 0.7827717662 * mc - 0.8086757660 * sc;
}

function oklabToLinRgb(L: number, a: number, b: number): [number, number, number] {
  const lc = L + 0.3963377774 * a + 0.2158037573 * b;
  const mc = L - 0.1055613458 * a - 0.0638541728 * b;
  const sc = L - 0.0894841775 * a - 1.2914855480 * b;
  return [
     4.0767416621 * lc*lc*lc - 3.3077115913 * mc*mc*mc + 0.2309699292 * sc*sc*sc,
    -1.2684380046 * lc*lc*lc + 2.6097574011 * mc*mc*mc - 0.3413193965 * sc*sc*sc,
    -0.0041960863 * lc*lc*lc - 0.7034186147 * mc*mc*mc + 1.7076147010 * sc*sc*sc,
  ];
}

// ─── Zone system masks ───────────────────────────────────────────────────────

const shadowW    = (L: number) => clamp01(1 - L / 0.4);
const highlightW = (L: number) => clamp01((L - 0.45) / 0.4);

function zoneGrainAmp(L: number): number {
  if (L < 0.20) return 1.55;
  if (L < 0.40) return 1.25;
  if (L < 0.60) return 1.00;
  if (L < 0.80) return 0.60;
  return 0.22;
}

// ─── Canvas helper ───────────────────────────────────────────────────────────

function tmpCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true })!;
  x.imageSmoothingEnabled = true;
  x.imageSmoothingQuality = 'high';
  return [c, x];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main render pipeline
// ═══════════════════════════════════════════════════════════════════════════════

export async function renderToCanvas(
  imageSrc: string,
  filter: Filter,
  filterIntensity: number,
  adj: Adjustments,
  canvas: HTMLCanvasElement,
  maxDimension?: number,
): Promise<void> {

  // ── Load image ────────────────────────────────────────────────────────────
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  let W = img.naturalWidth, H = img.naturalHeight;
  if (maxDimension && Math.max(W, H) > maxDimension) {
    const s = maxDimension / Math.max(W, H);
    W = Math.round(W * s); H = Math.round(H * s);
  }
  const N = W * H;

  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── Step 1: High-quality downscale ────────────────────────────────────────
  if (maxDimension && Math.max(img.naturalWidth, img.naturalHeight) > maxDimension * 2) {
    const mw = Math.round(img.naturalWidth * 0.5), mh = Math.round(img.naturalHeight * 0.5);
    const [mc, mx] = tmpCanvas(mw, mh);
    mx.drawImage(img, 0, 0, mw, mh);
    ctx.drawImage(mc, 0, 0, W, H);
  } else {
    ctx.drawImage(img, 0, 0, W, H);
  }

  // ── Step 2: Film filter CSS overlay ───────────────────────────────────────
  if (filter.css !== 'none' && filterIntensity > 0) {
    const [fc, fx] = tmpCanvas(W, H);
    fx.filter = filter.css;
    fx.drawImage(img, 0, 0, W, H);
    fx.filter = 'none';
    ctx.globalAlpha = filterIntensity / 100;
    ctx.drawImage(fc, 0, 0);
    ctx.globalAlpha = 1;
  }

  await yld();

  // ══════════════════════════════════════════════════════════════════════════
  // Step 3: MAIN OKLAB PIXEL PASS (single getImageData, zero tuple allocs)
  //
  // All tone + color operations in one pass through Oklab space:
  //   exposure · brightness · contrast · zone shadows/highlights ·
  //   highlight rolloff · warmth · tint · hue · saturation + vibrance
  //   (with subtractive mixing) · sepia · grayscale · split tone · invert
  // ══════════════════════════════════════════════════════════════════════════
  {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;

    // Pre-compute ALL constants outside the loop
    const expMul     = Math.pow(2, adj.exposure / 50);
    const doExp      = expMul !== 1;
    const brightAdd  = (adj.brightness / 100) * 0.18;
    const contK      = 1 + adj.contrast / 100;
    const doCont     = contK !== 1;
    const hiAmt      = adj.highlights / 200;
    const shAmt      = adj.shadows / 200;
    const doHiSh     = hiAmt !== 0 || shAmt !== 0;
    const satMul     = 1 + adj.saturation / 100;
    const vibAmt     = adj.vibrance / 100;
    const warmA      = (adj.warmth / 100) * 0.055;
    const warmB      = (adj.warmth / 100) * 0.038;
    const tintA      = (adj.tint / 100) * 0.045;
    const chromaA    = warmA + tintA;
    const hueRad     = (adj.hue / 360) * 2 * Math.PI;
    const doHue      = hueRad !== 0;
    const cosH       = Math.cos(hueRad);
    const sinH       = Math.sin(hueRad);
    const sepiaAmt   = adj.sepia / 100;
    const doSepia    = sepiaAmt > 0;
    const grayAmt    = adj.grayscale / 100;
    const doGray     = grayAmt > 0;
    const invAmt     = adj.invert / 100;
    const doInv      = invAmt > 0;
    const hrAmt      = adj.highlightRolloff / 100;
    const doHR       = hrAmt > 0;
    const stSH       = adj.splitToneShadow;
    const stHH       = adj.splitToneHighlight;
    // Pre-compute split tone trig (was per-pixel before — huge waste)
    const doStSh     = stSH !== 0;
    const stShRad    = (stSH / 360) * 2 * Math.PI;
    const stShCos    = Math.cos(stShRad) * 0.045;
    const stShSin    = Math.sin(stShRad) * 0.045;
    const doStHi     = stHH !== 0;
    const stHiRad    = (stHH / 360) * 2 * Math.PI;
    const stHiCos    = Math.cos(stHiRad) * 0.040;
    const stHiSin    = Math.sin(stHiRad) * 0.040;
    const SUBK       = 0.14;

    for (let i = 0; i < N; i++) {
      const ri = i << 2; // i * 4, faster
      rgb8ToOklab(px[ri], px[ri + 1], px[ri + 2]);
      let L = _oL, a = _oa, b = _ob;

      // Exposure (linear-light multiply, back to Oklab)
      if (doExp) {
        const [rl, gl, bl] = oklabToLinRgb(L, a, b);
        linRgbToOklab(clamp01(rl * expMul), clamp01(gl * expMul), clamp01(bl * expMul));
        L = _oL; a = _oa; b = _ob;
      }

      // Brightness
      L = clamp01(L + brightAdd);

      // Contrast (pivot 0.5)
      if (doCont) L = clamp01((L - 0.5) * contK + 0.5);

      // Zone-weighted shadows / highlights
      if (doHiSh) {
        const sw = shadowW(L);
        const hw = highlightW(L);
        if (shAmt !== 0) L = clamp01(L + shAmt * sw);
        if (hiAmt !== 0) L = clamp01(L + hiAmt * hw);
      }

      // Highlight rolloff (shoulder compression)
      if (doHR && L > 0.72) {
        const t = (L - 0.72) / 0.28;
        L = clamp01(L - t * t * hrAmt * 0.12);
      }

      // Warmth + tint (pre-summed)
      a += chromaA;
      b += warmB;

      // Hue rotation
      if (doHue) {
        const na = a * cosH - b * sinH;
        b = a * sinH + b * cosH;
        a = na;
      }

      // Saturation + vibrance + subtractive mixing
      const C_old  = Math.sqrt(a * a + b * b);
      const vibMul = vibAmt > 0
        ? 1 + vibAmt * Math.max(0, 1 - C_old * 2.5)
        : 1 + vibAmt * 0.6;
      const totMul = Math.max(0.01, satMul * Math.max(0.01, vibMul));
      a *= totMul; b *= totMul;
      const C_new = Math.sqrt(a * a + b * b);
      L = clamp01(L - SUBK * Math.max(0, C_new - C_old));

      // Sepia
      if (doSepia) {
        const inv_s = 1 - sepiaAmt;
        a = a * inv_s + 0.052 * sepiaAmt;
        b = b * inv_s + 0.028 * sepiaAmt;
      }

      // Grayscale
      if (doGray) { a *= (1 - grayAmt); b *= (1 - grayAmt); }

      // Split tone — pre-computed trig
      if (doStSh) {
        const sw = shadowW(L);
        if (sw > 0.01) {
          const w = sw * 0.5;
          const w1 = 1 - w;
          a = a * w1 + stShCos * w;
          b = b * w1 + stShSin * w;
        }
      }
      if (doStHi) {
        const hw = highlightW(L);
        if (hw > 0.01) {
          const w = hw * 0.4;
          const w1 = 1 - w;
          a = a * w1 + stHiCos * w;
          b = b * w1 + stHiSin * w;
        }
      }

      // Invert
      if (doInv) {
        L = L + (1 - 2 * L) * invAmt;
        a *= (1 - invAmt);
        b *= (1 - invAmt);
      }

      oklabToRgb8(L, a, b);
      px[ri] = _r8; px[ri + 1] = _g8; px[ri + 2] = _b8;
    }

    ctx.putImageData(d, 0, 0);
  }

  await yld();

  // ══════════════════════════════════════════════════════════════════════════
  // Step 4: MERGED DETAIL PASS — micro-contrast + clarity + sharpness + detail
  //
  // All four share the same L-channel extraction. We extract once, blur at
  // multiple radii, then apply all boosts in a single write-back loop.
  // This avoids 4 separate getImageData/putImageData round-trips and
  // 4 separate Oklab conversions.
  // ══════════════════════════════════════════════════════════════════════════
  const needMicro = adj.microContrast > 0;
  const needClarity = adj.clarity !== 0;
  const needSharp = adj.sharpness > 0;
  const needDetail = adj.detail > 0;

  if (needMicro || needClarity || needSharp || needDetail) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;

    // Extract L channel once
    const Lch = getBuffer(N);
    for (let i = 0; i < N; i++) {
      rgb8ToOklab(px[i << 2], px[(i << 2) + 1], px[(i << 2) + 2]);
      Lch[i] = _oL;
    }

    await yld();

    // Compute blurred versions at required radii
    // Micro-contrast: fine (r0) + medium (r1) Laplacian pyramid
    const r_mc0  = needMicro ? Math.max(1, Math.round(W * 0.004)) : 0;
    const r_mc1  = needMicro ? Math.max(2, Math.round(W * 0.015)) : 0;
    // Clarity: medium-scale USM
    const r_clar = needClarity ? Math.max(2, Math.round(W * 0.022)) : 0;
    // Sharpness: fine edge
    const r_shrp = needSharp ? Math.max(1, Math.round(W * 0.005)) : 0;
    // Detail: very fine texture
    const r_det  = needDetail ? Math.max(1, Math.round(W * 0.002)) : 0;

    // Collect unique radii to blur (avoid blurring the same radius twice)
    const radiiSet = new Set<number>();
    if (needMicro)   { radiiSet.add(r_mc0); radiiSet.add(r_mc1); }
    if (needClarity) radiiSet.add(r_clar);
    if (needSharp)   radiiSet.add(r_shrp);
    if (needDetail)  radiiSet.add(r_det);

    const blurCache = new Map<number, Float32Array>();

    // We need cascaded blurs for micro-contrast (base0 → base1)
    // but separate blurs for the others from original L
    let base0: Float32Array | null = null;
    let base1: Float32Array | null = null;

    if (needMicro) {
      base0 = blur(Lch, W, H, r_mc0); await yld();
      base1 = blur(base0, W, H, r_mc1); await yld();
      blurCache.set(r_mc0, base0);
    }

    // Blur remaining radii from original L (skip if already done as r_mc0)
    for (const r of radiiSet) {
      if (blurCache.has(r)) continue;
      if (r === r_mc1 && base1) { blurCache.set(r, base1); continue; }
      const bl = blur(Lch, W, H, r); await yld();
      blurCache.set(r, bl);
    }

    // Pre-compute boost coefficients
    const mcFine = needMicro ? (adj.microContrast / 100) * 0.55 : 0;
    const mcMid  = needMicro ? (adj.microContrast / 100) * 0.90 : 0;
    const clarK  = needClarity ? (adj.clarity / 100) * 0.45 : 0;
    const shrpK  = needSharp ? (adj.sharpness / 100) * 0.55 : 0;
    const detK   = needDetail ? (adj.detail / 100) * 0.45 : 0;

    // Halo suppression soft clamp
    const softClamp = (v: number, max: number) => {
      const abs = v < 0 ? -v : v;
      return abs <= max ? v : (v < 0 ? -1 : 1) * (max + (abs - max) * 0.08);
    };

    const b0 = needMicro && base0 ? base0 : null;
    const b1 = needMicro && base1 ? base1 : null;
    const bClar = needClarity ? blurCache.get(r_clar)! : null;
    const bShrp = needSharp   ? blurCache.get(r_shrp)! : null;
    const bDet  = needDetail  ? blurCache.get(r_det)!  : null;

    // Single write-back pass
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      rgb8ToOklab(px[ri], px[ri + 1], px[ri + 2]);
      let L = _oL;
      const origL = Lch[i];

      // Micro-contrast (Laplacian pyramid)
      if (b0 && b1) {
        L += softClamp(origL - b0[i], 0.10) * mcFine;
        L += softClamp(b0[i] - b1[i], 0.10) * mcMid;
      }
      // Clarity
      if (bClar) {
        const e = origL - bClar[i];
        L += softClamp(e, 0.15) * clarK;
      }
      // Sharpness
      if (bShrp) {
        const e = origL - bShrp[i];
        L += softClamp(e, 0.09) * shrpK;
      }
      // Detail
      if (bDet) {
        const e = origL - bDet[i];
        L += softClamp(e, 0.06) * detK;
      }

      oklabToRgb8(clamp01(L), _oa, _ob);
      px[ri] = _r8; px[ri + 1] = _g8; px[ri + 2] = _b8;
    }

    // Free pooled buffers
    freeBuffer(Lch);
    for (const b of blurCache.values()) freeBuffer(b);
    if (base1 && !blurCache.has(r_mc1)) freeBuffer(base1);

    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ── Step 5: Dehaze ────────────────────────────────────────────────────────
  if (adj.dehaze !== 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const k  = adj.dehaze / 100;
    const aMul = 1 + 0.12 * k;
    const bMul = 1 + 0.08 * k;
    const cMul = 1 + 0.28 * k;
    const off  = -0.07 * k;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      rgb8ToOklab(px[ri], px[ri + 1], px[ri + 2]);
      oklabToRgb8(
        clamp01((_oL + off - 0.5) * cMul + 0.5),
        _oa * aMul,
        _ob * bMul,
      );
      px[ri] = _r8; px[ri + 1] = _g8; px[ri + 2] = _b8;
    }
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Step 6: Physical Halation (multi-scale PSF, per-channel R>G>B radii)
  //
  // Optimised: reuse buffers, single highlight extraction per scale,
  // extract channels once, accumulate in-place.
  // ══════════════════════════════════════════════════════════════════════════
  if (adj.halation > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;

    // Extract linear channels once
    const rC = getBuffer(N), gC = getBuffer(N), bC = getBuffer(N);
    for (let i = 0; i < N; i++) {
      rC[i] = TO_LINEAR[px[i << 2]];
      gC[i] = TO_LINEAR[px[(i << 2) + 1]];
      bC[i] = TO_LINEAR[px[(i << 2) + 2]];
    }

    const baseR = Math.max(2, Math.round((adj.halation / 100) * W * 0.018));
    const hR = getBuffer(N), hG = getBuffer(N), hB = getBuffer(N);
    const rH = getBuffer(N), gH = getBuffer(N), bH = getBuffer(N);

    const scales = [
      { rMul: 1.0, w: 0.50 },
      { rMul: 2.8, w: 0.32 },
      { rMul: 7.0, w: 0.18 },
    ];

    for (const { rMul, w } of scales) {
      // Highlight mask + channel extraction (reuse buffers)
      for (let i = 0; i < N; i++) {
        const lum  = 0.2126 * rC[i] + 0.7152 * gC[i] + 0.0722 * bC[i];
        const mask = clamp01((lum - 0.5) * 2);
        rH[i] = rC[i] * mask;
        gH[i] = gC[i] * mask;
        bH[i] = bC[i] * mask;
      }

      const rr = Math.max(1, Math.round(baseR * rMul * 1.00));
      const rg = Math.max(1, Math.round(baseR * rMul * 0.62));
      const rb = Math.max(1, Math.round(baseR * rMul * 0.30));

      const bR = blur(rH, W, H, rr); await yld();
      const bG = blur(gH, W, H, rg); await yld();
      const bB = blur(bH, W, H, rb); await yld();

      for (let i = 0; i < N; i++) {
        hR[i] += bR[i] * w;
        hG[i] += bG[i] * w;
        hB[i] += bB[i] * w;
      }
      freeBuffer(bR); freeBuffer(bG); freeBuffer(bB);
    }

    const str = (adj.halation / 100) * 0.75;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      px[ri]     = lin2g(clamp01(rC[i] + hR[i] * str * 1.25));
      px[ri + 1] = lin2g(clamp01(gC[i] + hG[i] * str * 0.80));
      px[ri + 2] = lin2g(clamp01(bC[i] + hB[i] * str * 0.35));
    }
    freeBuffer(rC); freeBuffer(gC); freeBuffer(bC);
    freeBuffer(hR); freeBuffer(hG); freeBuffer(hB);
    freeBuffer(rH); freeBuffer(gH); freeBuffer(bH);
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ── Step 7: Bloom (highlight glow) ────────────────────────────────────────
  if (adj.bloom > 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const rC = getBuffer(N), gC = getBuffer(N), bC = getBuffer(N);
    for (let i = 0; i < N; i++) {
      const lum  = 0.2126 * TO_LINEAR[px[i<<2]] + 0.7152 * TO_LINEAR[px[(i<<2)+1]] + 0.0722 * TO_LINEAR[px[(i<<2)+2]];
      const mask = clamp01((lum - 0.58) * 2.8);
      rC[i] = TO_LINEAR[px[i<<2]]   * mask;
      gC[i] = TO_LINEAR[px[(i<<2)+1]] * mask;
      bC[i] = TO_LINEAR[px[(i<<2)+2]] * mask;
    }
    const br = Math.max(2, Math.round(W * 0.026));
    const bR = blur(rC, W, H, br); await yld();
    const bG = blur(gC, W, H, br);
    const bB = blur(bC, W, H, br);
    const str = (adj.bloom / 100) * 0.48;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      px[ri]     = lin2g(clamp01(TO_LINEAR[px[ri]]     + bR[i] * str));
      px[ri + 1] = lin2g(clamp01(TO_LINEAR[px[ri + 1]] + bG[i] * str));
      px[ri + 2] = lin2g(clamp01(TO_LINEAR[px[ri + 2]] + bB[i] * str));
    }
    freeBuffer(rC); freeBuffer(gC); freeBuffer(bC);
    freeBuffer(bR); freeBuffer(bG); freeBuffer(bB);
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ── Step 8: Soft Focus ────────────────────────────────────────────────────
  if (adj.softFocus > 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const rC = getBuffer(N), gC = getBuffer(N), bC = getBuffer(N);
    for (let i = 0; i < N; i++) {
      rC[i] = TO_LINEAR[px[i<<2]]; gC[i] = TO_LINEAR[px[(i<<2)+1]]; bC[i] = TO_LINEAR[px[(i<<2)+2]];
    }
    const sr = Math.max(2, Math.round(W * 0.016));
    const bR = blur(rC, W, H, sr); await yld();
    const bG = blur(gC, W, H, sr);
    const bB = blur(bC, W, H, sr);
    const mix = (adj.softFocus / 100) * 0.48, inv = 1 - mix;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      px[ri]     = lin2g(rC[i] * inv + bR[i] * mix);
      px[ri + 1] = lin2g(gC[i] * inv + bG[i] * mix);
      px[ri + 2] = lin2g(bC[i] * inv + bB[i] * mix);
    }
    freeBuffer(rC); freeBuffer(gC); freeBuffer(bC);
    freeBuffer(bR); freeBuffer(bG); freeBuffer(bB);
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ── Step 9: Portrait Glow ─────────────────────────────────────────────────
  if (adj.portraitGlow > 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const rC = getBuffer(N), gC = getBuffer(N), bC = getBuffer(N);
    for (let i = 0; i < N; i++) {
      rC[i] = TO_LINEAR[px[i<<2]]; gC[i] = TO_LINEAR[px[(i<<2)+1]]; bC[i] = TO_LINEAR[px[(i<<2)+2]];
    }
    const pr = Math.max(3, Math.round(W * 0.042));
    const bR = blur(rC, W, H, pr); await yld();
    const bG = blur(gC, W, H, pr);
    const bB = blur(bC, W, H, pr);
    const mix = (adj.portraitGlow / 100) * 0.32;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      px[ri]     = lin2g(clamp01(rC[i] + bR[i] * mix * 1.08));
      px[ri + 1] = lin2g(clamp01(gC[i] + bG[i] * mix * 0.95));
      px[ri + 2] = lin2g(clamp01(bC[i] + bB[i] * mix * 0.78));
    }
    freeBuffer(rC); freeBuffer(gC); freeBuffer(bC);
    freeBuffer(bR); freeBuffer(bG); freeBuffer(bB);
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ── Step 10: Zone-Aware Grain ─────────────────────────────────────────────
  if (adj.grain > 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const swing = (adj.grain / 100) * 0.044;
    _ni = (Math.random() * NTBL) | 0;
    for (let i = 0; i < N; i++) {
      const ri = i << 2;
      rgb8ToOklab(px[ri], px[ri + 1], px[ri + 2]);
      oklabToRgb8(clamp01(_oL + fgauss() * zoneGrainAmp(_oL) * swing), _oa, _ob);
      px[ri] = _r8; px[ri + 1] = _g8; px[ri + 2] = _b8;
    }
    ctx.putImageData(d, 0, 0);
    await yld();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Step 11: MERGED PER-PIXEL EFFECTS (fade + vignette — single pass)
  //
  // Both are simple per-pixel multiplies. Merging avoids a second
  // getImageData/putImageData round-trip.
  // ══════════════════════════════════════════════════════════════════════════
  if (adj.fade > 0 || adj.vignette > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const fadeK = (adj.fade / 100) * 0.20;
    const doFade = fadeK > 0;
    const vigStr = adj.vignette / 100;
    const doVig  = vigStr > 0;
    const cx = W / 2, cy = H / 2;
    const invCx = 1 / cx, invCy = 1 / cy;

    for (let y = 0; y < H; y++) {
      const dy = (y - cy) * invCy;
      const dy2 = dy * dy;
      for (let x = 0; x < W; x++) {
        const ri = (y * W + x) << 2;
        let r = TO_LINEAR[px[ri]], g = TO_LINEAR[px[ri + 1]], b = TO_LINEAR[px[ri + 2]];

        // Fade (lift blacks)
        if (doFade) {
          const f1 = 1 - fadeK;
          r = r * f1 + fadeK;
          g = g * f1 + fadeK;
          b = b * f1 + fadeK;
        }

        // Vignette
        if (doVig) {
          const dx = (x - cx) * invCx;
          const dist2 = dx * dx + dy2;
          const vig = clamp01(1 - vigStr * Math.pow(dist2, 1.25) * 0.85);
          r *= vig; g *= vig; b *= vig;
        }

        px[ri] = lin2g(r); px[ri + 1] = lin2g(g); px[ri + 2] = lin2g(b);
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 12: Light Leak (canvas gradient, screen blend) ───────────────────
  if (adj.lightLeak > 0) {
    const [lc, lx] = tmpCanvas(W, H);
    const s = (adj.lightLeak / 100) * 0.55;
    const g = lx.createRadialGradient(W * 0.85, H * 0.08, 0, W * 0.85, H * 0.08, Math.max(W, H) * 1.1);
    g.addColorStop(0,    `rgba(255,190,60,${s})`);
    g.addColorStop(0.25, `rgba(255,110,30,${s * 0.65})`);
    g.addColorStop(0.6,  `rgba(255,50,100,${s * 0.22})`);
    g.addColorStop(1,    'rgba(0,0,0,0)');
    lx.fillStyle = g; lx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(lc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 13: Film Burn ────────────────────────────────────────────────────
  if (adj.filmBurn > 0) {
    const [bc, bx] = tmpCanvas(W, H);
    const s = (adj.filmBurn / 100) * 0.65;
    const g = bx.createRadialGradient(W / 2, H / 2, W * 0.22, W / 2, H / 2, W * 0.85);
    g.addColorStop(0,    'rgba(0,0,0,0)');
    g.addColorStop(0.65, `rgba(170,55,0,${s * 0.28})`);
    g.addColorStop(1,    `rgba(90,15,0,${s})`);
    bx.fillStyle = g; bx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(bc, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── Step 14: Dust ─────────────────────────────────────────────────────────
  if (adj.dust > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const count = ((adj.dust / 100) * N * 0.00028) | 0;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * W) | 0, y = (Math.random() * H) | 0;
      const sz = Math.random() < 0.72 ? 1 : 2;
      const o = 0.35 + Math.random() * 0.55;
      const io = 1 - o;
      for (let dy = 0; dy < sz; dy++) {
        for (let dx = 0; dx < sz; dx++) {
          const ri = (Math.min(H - 1, y + dy) * W + Math.min(W - 1, x + dx)) << 2;
          px[ri]     = (px[ri]     * io + 22 * o + 0.5) | 0;
          px[ri + 1] = (px[ri + 1] * io + 16 * o + 0.5) | 0;
          px[ri + 2] = (px[ri + 2] * io + 10 * o + 0.5) | 0;
        }
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 15: Chromatic Aberration ─────────────────────────────────────────
  if (adj.chromaticAberration > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const orig = new Uint8ClampedArray(px);
    const ox = Math.round((adj.chromaticAberration / 100) * W * 0.009);
    const oy = Math.round((adj.chromaticAberration / 100) * H * 0.004);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ri = (y * W + x) << 2;
        const rxS = Math.min(W - 1, Math.max(0, x - ox));
        const ryS = Math.min(H - 1, Math.max(0, y - oy));
        const bxS = Math.min(W - 1, Math.max(0, x + ox));
        const byS = Math.min(H - 1, Math.max(0, y + oy));
        px[ri]     = orig[(ryS * W + rxS) << 2];
        px[ri + 2] = orig[((byS * W + bxS) << 2) + 2];
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 16: Dispersion ───────────────────────────────────────────────────
  if (adj.dispersion > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const orig = new Uint8ClampedArray(px);
    const amt = Math.round((adj.dispersion / 100) * W * 0.038);
    const ofy = Math.round(amt * 0.3);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ri = (y * W + x) << 2;
        const rxS = Math.min(W - 1, Math.max(0, x - amt));
        const ryS = Math.min(H - 1, Math.max(0, y + ofy));
        const bxS = Math.min(W - 1, Math.max(0, x + amt));
        const byS = Math.min(H - 1, Math.max(0, y - ofy));
        px[ri]     = orig[(ryS * W + rxS) << 2];
        px[ri + 2] = orig[((byS * W + bxS) << 2) + 2];
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 17: Posterize ────────────────────────────────────────────────────
  if (adj.posterize > 0) {
    const d  = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const levels = Math.max(2, Math.round(8 - (adj.posterize / 100) * 6));
    const step = 255 / (levels - 1);
    const invStep = 1 / step;
    for (let i = 0, ri = 0; i < N; i++, ri += 4) {
      px[ri]     = Math.round((px[ri]     * invStep + 0.5) | 0) * step;
      px[ri + 1] = Math.round((px[ri + 1] * invStep + 0.5) | 0) * step;
      px[ri + 2] = Math.round((px[ri + 2] * invStep + 0.5) | 0) * step;
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── Step 18: Pixelate ─────────────────────────────────────────────────────
  if (adj.pixelate > 0) {
    const blk = Math.max(2, Math.round((adj.pixelate / 100) * W * 0.055));
    const [snap, sx] = tmpCanvas(W, H);
    sx.drawImage(canvas, 0, 0);
    const dw = Math.max(1, Math.ceil(W / blk)), dh = Math.max(1, Math.ceil(H / blk));
    const [sm, smx] = tmpCanvas(dw, dh);
    smx.drawImage(snap, 0, 0, dw, dh);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sm, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }

  // ── Step 19: Scan Lines ───────────────────────────────────────────────────
  if (adj.scanLines > 0) {
    const str = (adj.scanLines / 100) * 0.48;
    ctx.fillStyle = `rgba(0,0,0,${str})`;
    for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
  }

  // ── Step 20: Blur ─────────────────────────────────────────────────────────
  if (adj.blur > 0) {
    const d = ctx.getImageData(0, 0, W, H);
    const px = d.data;
    const rC = getBuffer(N), gC = getBuffer(N), bC = getBuffer(N);
    for (let i = 0; i < N; i++) {
      rC[i] = px[i<<2]; gC[i] = px[(i<<2)+1]; bC[i] = px[(i<<2)+2];
    }
    const br = Math.max(1, Math.round((adj.blur / 100) * W * 0.032));
    const bR = blur(rC, W, H, br); await yld();
    const bG = blur(gC, W, H, br);
    const bB = blur(bC, W, H, br);
    for (let i = 0, ri = 0; i < N; i++, ri += 4) {
      px[ri]     = Math.min(255, Math.max(0, Math.round(bR[i])));
      px[ri + 1] = Math.min(255, Math.max(0, Math.round(bG[i])));
      px[ri + 2] = Math.min(255, Math.max(0, Math.round(bB[i])));
    }
    freeBuffer(rC); freeBuffer(gC); freeBuffer(bC);
    freeBuffer(bR); freeBuffer(bG); freeBuffer(bB);
    ctx.putImageData(d, 0, 0);
  }
}
