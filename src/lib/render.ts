import { Adjustments } from '../types';
import { Filter } from './filters';
import { getAdjustmentCss, hueToRgb } from './utils';

/**
 * Renders a photo with all filter + adjustment effects onto a canvas.
 * Used for both the live preview (downscaled) and final export (full res).
 * maxDimension: if set, image is scaled so the longest edge ≤ this value.
 */
export async function renderToCanvas(
  imageSrc: string,
  filter: Filter,
  filterIntensity: number,
  adjustments: Adjustments,
  canvas: HTMLCanvasElement,
  maxDimension?: number,
): Promise<void> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageSrc;
  });

  let W = img.naturalWidth;
  let H = img.naturalHeight;

  if (maxDimension && Math.max(W, H) > maxDimension) {
    const scale = maxDimension / Math.max(W, H);
    W = Math.round(W * scale);
    H = Math.round(H * scale);
  }

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // ── 1. Composite: base + film filter at intensity ─────────────────────────
  const comp = document.createElement('canvas');
  comp.width = W; comp.height = H;
  const cCtx = comp.getContext('2d')!;
  cCtx.drawImage(img, 0, 0, W, H);
  if (filter.css !== 'none' && filterIntensity > 0) {
    cCtx.globalAlpha = filterIntensity / 100;
    cCtx.filter = filter.css;
    cCtx.drawImage(img, 0, 0, W, H);
    cCtx.globalAlpha = 1;
    cCtx.filter = 'none';
  }

  // ── 2. CSS adjustments (exposure, contrast, saturation, etc.) ────────────
  ctx.filter = getAdjustmentCss(adjustments) || 'none';
  ctx.drawImage(comp, 0, 0);
  ctx.filter = 'none';

  // ── 3. Sharpness (unsharp mask) ──────────────────────────────────────────
  if (adjustments.sharpness > 0) {
    const amt = adjustments.sharpness / 100;
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const t = tmp.getContext('2d')!;
    t.filter = `blur(${1 + amt}px)`; t.drawImage(canvas, 0, 0); t.filter = 'none';
    const o = ctx.getImageData(0, 0, W, H);
    const b = t.getImageData(0, 0, W, H);
    const r = ctx.createImageData(W, H);
    for (let i = 0; i < o.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++)
        r.data[i+ch] = Math.min(255, Math.max(0, o.data[i+ch] + (o.data[i+ch] - b.data[i+ch]) * (amt * 1.5)));
      r.data[i+3] = o.data[i+3];
    }
    ctx.putImageData(r, 0, 0);
  }

  // ── 4. Detail (local contrast / edge accentuation) ───────────────────────
  if (adjustments.detail > 0) {
    const amt = adjustments.detail / 100;
    const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H;
    const t = tmp.getContext('2d')!;
    t.filter = `blur(${2 + amt * 3}px)`; t.drawImage(canvas, 0, 0); t.filter = 'none';
    const o = ctx.getImageData(0, 0, W, H);
    const b = t.getImageData(0, 0, W, H);
    const r = ctx.createImageData(W, H);
    for (let i = 0; i < o.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++)
        r.data[i+ch] = Math.min(255, Math.max(0, o.data[i+ch] + (o.data[i+ch] - b.data[i+ch]) * (amt * 2.2)));
      r.data[i+3] = o.data[i+3];
    }
    ctx.putImageData(r, 0, 0);
  }

  // ── 5. Micro-Contrast (sigmoid S-curve on luminance — Leica 3D pop) ──────
  if (adjustments.microContrast > 0) {
    const strength = (adjustments.microContrast / 100) * 0.38;
    const d = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < d.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const v = d.data[i+ch] / 255;
        const curved = v + strength * (v - 0.5) * (1 - Math.pow(Math.abs(v - 0.5) * 1.8, 1.4));
        d.data[i+ch] = Math.min(255, Math.max(0, curved * 255));
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── 6. Highlight Rolloff (exponential shoulder — film character) ──────────
  if (adjustments.highlightRolloff > 0) {
    const rolloff = (adjustments.highlightRolloff / 100) * 0.72;
    const threshold = 0.72;
    const range = 1 - threshold;
    const d = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < d.data.length; i += 4) {
      for (let ch = 0; ch < 3; ch++) {
        const v = d.data[i+ch] / 255;
        if (v > threshold) {
          const excess = v - threshold;
          d.data[i+ch] = Math.min(255, Math.max(0,
            (threshold + range * (1 - Math.exp(-excess / range * (1.8 - rolloff * 1.2)))) * 255
          ));
        }
      }
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── 7. Portrait Glow (warm skin-tone enhancing glow) ─────────────────────
  if (adjustments.portraitGlow > 0) {
    const amt = adjustments.portraitGlow / 100;
    const pgc = document.createElement('canvas'); pgc.width = W; pgc.height = H;
    const pgx = pgc.getContext('2d')!;
    pgx.filter = `blur(${8 + amt * 18}px) brightness(1.2) saturate(1.3)`;
    pgx.drawImage(canvas, 0, 0); pgx.filter = 'none';
    pgx.globalCompositeOperation = 'multiply';
    pgx.fillStyle = `rgba(255,220,170,${0.3 + amt * 0.2})`;
    pgx.fillRect(0, 0, W, H);
    pgx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = amt * 0.32;
    ctx.drawImage(pgc, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ── 8. Posterize ─────────────────────────────────────────────────────────
  if (adjustments.posterize > 0) {
    const levels = Math.max(2, Math.round(32 - (adjustments.posterize / 100) * 30));
    const step = 255 / (levels - 1);
    const d = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < d.data.length; i += 4) {
      d.data[i]   = Math.round(Math.round(d.data[i]   / step) * step);
      d.data[i+1] = Math.round(Math.round(d.data[i+1] / step) * step);
      d.data[i+2] = Math.round(Math.round(d.data[i+2] / step) * step);
    }
    ctx.putImageData(d, 0, 0);
  }

  // ── 9. Bloom ──────────────────────────────────────────────────────────────
  if (adjustments.bloom > 0) {
    const amt = adjustments.bloom / 100;
    const bc = document.createElement('canvas'); bc.width = W; bc.height = H;
    const bx = bc.getContext('2d')!;
    bx.filter = `brightness(1.5) blur(${10 + amt * 20}px)`;
    bx.drawImage(canvas, 0, 0); bx.filter = 'none';
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.4;
    ctx.drawImage(bc, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ── 10. Halation (film emulsion glow on bright edges) ────────────────────
  if (adjustments.halation > 0) {
    const amt = adjustments.halation / 100;
    const hc = document.createElement('canvas'); hc.width = W; hc.height = H;
    const hx = hc.getContext('2d')!;
    hx.filter = `brightness(1.3) blur(${15 + amt * 25}px) saturate(1.5) hue-rotate(-15deg)`;
    hx.drawImage(canvas, 0, 0); hx.filter = 'none';
    hx.globalCompositeOperation = 'multiply';
    hx.fillStyle = 'rgba(255,120,60,0.6)'; hx.fillRect(0, 0, W, H);
    hx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.5;
    ctx.drawImage(hc, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ── 11. Soft Focus (dreamy screen glow) ──────────────────────────────────
  if (adjustments.softFocus > 0) {
    const amt = adjustments.softFocus / 100;
    const sc = document.createElement('canvas'); sc.width = W; sc.height = H;
    const sx = sc.getContext('2d')!;
    sx.filter = `blur(${3 + amt * 14}px) brightness(1.12)`;
    sx.drawImage(canvas, 0, 0); sx.filter = 'none';
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.48;
    ctx.drawImage(sc, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  // ── 12. Chromatic Aberration (RGB channel split) ──────────────────────────
  if (adjustments.chromaticAberration > 0) {
    const shift = Math.round(W * (adjustments.chromaticAberration / 100) * 0.016);
    if (shift > 0) {
      const o = ctx.getImageData(0, 0, W, H);
      const r = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const ri = (y * W + Math.min(W-1, x + shift)) * 4;
          const bi = (y * W + Math.max(0, x - shift)) * 4;
          r.data[i] = o.data[ri]; r.data[i+1] = o.data[i+1]; r.data[i+2] = o.data[bi+2]; r.data[i+3] = o.data[i+3];
        }
      }
      ctx.putImageData(r, 0, 0);
    }
  }

  // ── 13. Dispersion (radial prismatic RGB spread) ──────────────────────────
  if (adjustments.dispersion > 0) {
    const amt = adjustments.dispersion / 100;
    const maxShift = Math.round(W * amt * 0.022);
    if (maxShift > 0) {
      const cx2 = W / 2, cy2 = H / 2;
      const o = ctx.getImageData(0, 0, W, H);
      const r = ctx.createImageData(W, H);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const i = (y * W + x) * 4;
          const dx = (x - cx2) / cx2, dy = (y - cy2) / cy2;
          const s = Math.round(maxShift * Math.sqrt(dx*dx + dy*dy));
          const rx = Math.min(W-1, Math.max(0, x + Math.round(dx * s)));
          const ry = Math.min(H-1, Math.max(0, y + Math.round(dy * s)));
          const ri = (ry * W + rx) * 4;
          const bxp = Math.min(W-1, Math.max(0, x - Math.round(dx * s)));
          const byp = Math.min(H-1, Math.max(0, y - Math.round(dy * s)));
          const bi = (byp * W + bxp) * 4;
          r.data[i] = o.data[ri]; r.data[i+1] = o.data[i+1]; r.data[i+2] = o.data[bi+2]; r.data[i+3] = o.data[i+3];
        }
      }
      ctx.putImageData(r, 0, 0);
    }
  }

  // ── 14. Split Tone Shadow ─────────────────────────────────────────────────
  if (adjustments.splitToneShadow !== 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${hueToRgb(adjustments.splitToneShadow)}, 0.18)`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 15. Split Tone Highlight ──────────────────────────────────────────────
  if (adjustments.splitToneHighlight !== 0) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = `rgba(${hueToRgb(adjustments.splitToneHighlight)}, 0.15)`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 16. Film tint overlay ─────────────────────────────────────────────────
  if (filter.tintOverlay) {
    ctx.fillStyle = filter.tintOverlay;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 17. Shadow tint (radial multiply) ────────────────────────────────────
  if (filter.shadowTint) {
    const sc2 = document.createElement('canvas'); sc2.width = W; sc2.height = H;
    const sx2 = sc2.getContext('2d')!;
    const grad = sx2.createRadialGradient(W/2, H/2, W*0.2, W/2, H/2, Math.max(W,H)*0.9);
    grad.addColorStop(0, 'rgba(255,255,255,0.97)');
    grad.addColorStop(1, filter.shadowTint);
    sx2.fillStyle = grad; sx2.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(sc2, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 18. Burn edges ────────────────────────────────────────────────────────
  if (filter.burnEdges && filter.burnEdges > 0) {
    const bc2 = document.createElement('canvas'); bc2.width = W; bc2.height = H;
    const bx2 = bc2.getContext('2d')!;
    const grad = bx2.createRadialGradient(W/2, H/2, W*0.28, W/2, H/2, Math.max(W,H)*0.82);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, `rgba(0,0,0,${(filter.burnEdges/100)*0.88})`);
    bx2.fillStyle = grad; bx2.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(bc2, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 19. Fade (shadow lift) ────────────────────────────────────────────────
  if (adjustments.fade > 0) {
    ctx.fillStyle = `rgba(50,50,50,${adjustments.fade / 100})`;
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 20. Vignette ──────────────────────────────────────────────────────────
  if (adjustments.vignette > 0) {
    const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // ── 21. Grain (overlay) ───────────────────────────────────────────────────
  if (adjustments.grain > 0) {
    const nc = document.createElement('canvas'); nc.width = 512; nc.height = 512;
    const nx = nc.getContext('2d')!;
    const nd = nx.createImageData(512, 512);
    for (let i = 0; i < nd.data.length; i += 4) {
      const v = Math.random() * 255;
      nd.data[i] = nd.data[i+1] = nd.data[i+2] = v;
      nd.data[i+3] = (adjustments.grain / 100) * 60;
    }
    nx.putImageData(nd, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(nc, 'repeat')!;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 22. Light Leak (top-left) ────────────────────────────────────────────
  if (adjustments.lightLeak > 0) {
    const a = adjustments.lightLeak / 100;
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, W*0.6);
    rg.addColorStop(0, `rgba(255,60,0,${a*0.8})`);
    rg.addColorStop(0.5, `rgba(255,120,0,${a*0.4})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    const lg = ctx.createLinearGradient(0, 0, W*0.2, 0);
    lg.addColorStop(0, `rgba(255,30,0,${a*0.3})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 23. Film Burn (bottom-right) ─────────────────────────────────────────
  if (adjustments.filmBurn > 0) {
    const a = adjustments.filmBurn / 100;
    const rg = ctx.createRadialGradient(W, H, 0, W, H, W*0.6);
    rg.addColorStop(0, `rgba(255,200,50,${a*0.8})`);
    rg.addColorStop(0.5, `rgba(255,100,0,${a*0.4})`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    const lg = ctx.createLinearGradient(0, H, 0, H*0.8);
    lg.addColorStop(0, `rgba(255,180,30,${a*0.25})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 24. Dust ──────────────────────────────────────────────────────────────
  if (adjustments.dust > 0) {
    const dc = document.createElement('canvas'); dc.width = 200; dc.height = 200;
    const dx = dc.getContext('2d')!;
    const a = adjustments.dust / 100;
    dx.strokeStyle = `rgba(255,255,255,${a*0.6})`; dx.lineWidth = 1;
    dx.fillStyle = `rgba(255,255,255,${a*0.5})`;
    dx.beginPath();
    dx.moveTo(10,20); dx.lineTo(15,25); dx.moveTo(180,150); dx.lineTo(185,145);
    dx.moveTo(50,80); dx.lineTo(52,85); dx.moveTo(120,30); dx.lineTo(125,35);
    dx.moveTo(30,170); dx.lineTo(35,165); dx.moveTo(160,50); dx.lineTo(165,55);
    dx.moveTo(90,120); dx.lineTo(92,125); dx.stroke();
    [[ 40,40,1],[150,100,2],[80,160,1.5],[110,20,2.5],[20,130,1.2],[180,180,1.8]].forEach(([cx,cy,r]) => {
      dx.beginPath(); dx.arc(cx,cy,r,0,Math.PI*2); dx.fill();
    });
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = ctx.createPattern(dc, 'repeat')!;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // ── 25. Scan Lines ────────────────────────────────────────────────────────
  if (adjustments.scanLines > 0) {
    ctx.fillStyle = `rgba(0,0,0,${(adjustments.scanLines / 100) * 0.35})`;
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y+2, W, 2);
  }

  // ── 26. Pixelate (applied last so it includes all effects) ───────────────
  if (adjustments.pixelate > 0) {
    const blockSize = Math.max(3, Math.round((adjustments.pixelate / 100) * 50));
    const pw = Math.ceil(W / blockSize), ph = Math.ceil(H / blockSize);
    const tc = document.createElement('canvas'); tc.width = pw; tc.height = ph;
    tc.getContext('2d')!.drawImage(canvas, 0, 0, pw, ph);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(tc, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  }
}
