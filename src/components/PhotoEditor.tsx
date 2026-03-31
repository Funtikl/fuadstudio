import React, { useRef, useState } from 'react';
import { Download, ChevronLeft, SlidersHorizontal, Image as ImageIcon, Undo2, Redo2, Eye, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { FILTERS } from '../lib/filters';
import FilterCarousel from './FilterCarousel';
import AdjustmentsPanel from './AdjustmentsPanel';
import { Adjustments } from '../types';
import { getAdjustmentCss, hueToRgb } from '../lib/utils';

interface PhotoEditorProps {
  imageSrc: string;
  initialFilterId: string;
  initialFilterIntensity: number;
  initialAdjustments: Adjustments;
  onClose: () => void;
  onSave: (filterId: string, filterIntensity: number, adjustments: Adjustments) => void;
}

interface EditorState {
  filterId: string;
  filterIntensity: number;
  adjustments: Adjustments;
}

export default function PhotoEditor({ imageSrc, initialFilterId, initialFilterIntensity, initialAdjustments, onClose, onSave }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'adjust'>('presets');
  const [isExporting, setIsExporting] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  const [history, setHistory] = useState<EditorState[]>([{ filterId: initialFilterId, filterIntensity: initialFilterIntensity, adjustments: initialAdjustments }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftState, setDraftState] = useState<EditorState | null>(null);

  const currentState = draftState || history[currentIndex];
  const activeFilterId = currentState.filterId;
  const filterIntensity = currentState.filterIntensity;
  const adjustments = currentState.adjustments;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const commitState = (newState: EditorState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setDraftState(null);
  };

  const undo = () => { if (canUndo) { setCurrentIndex(currentIndex - 1); setDraftState(null); } };
  const redo = () => { if (canRedo) { setCurrentIndex(currentIndex + 1); setDraftState(null); } };

  const handleAdjustmentChange = (newAdj: Adjustments, isFinal: boolean = false) => {
    if (isFinal) {
      const newState = { filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj };
      const committedState = history[currentIndex];
      if (JSON.stringify(committedState.adjustments) === JSON.stringify(newAdj) && committedState.filterId === newState.filterId && committedState.filterIntensity === newState.filterIntensity) {
        setDraftState(null); return;
      }
      commitState(newState);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj });
    }
  };

  const handleIntensityChange = (newIntensity: number, isFinal: boolean = false) => {
    if (isFinal) {
      const newState = { filterId: currentState.filterId, filterIntensity: newIntensity, adjustments: currentState.adjustments };
      const committedState = history[currentIndex];
      if (committedState.filterIntensity === newIntensity && committedState.filterId === newState.filterId && JSON.stringify(committedState.adjustments) === JSON.stringify(newState.adjustments)) {
        setDraftState(null); return;
      }
      commitState(newState);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: newIntensity, adjustments: currentState.adjustments });
    }
  };

  const handleFilterSelect = (filterId: string) => {
    if (filterId === currentState.filterId) return;
    const selectedFilter = FILTERS.find(f => f.id === filterId);
    const newAdjustments: Adjustments = {
      ...currentState.adjustments,
      grain: selectedFilter?.grain ?? 0,
      vignette: selectedFilter?.vignette ?? 0,
      lightLeak: selectedFilter?.lightLeak ?? 0,
      dust: selectedFilter?.dust ?? 0,
      halation: selectedFilter?.halation ?? 0,
      fade: selectedFilter?.fade ?? 0,
      bloom: selectedFilter?.bloom ?? 0,
      chromaticAberration: selectedFilter?.chromaticAberration ?? 0,
      softFocus: selectedFilter?.softFocus ?? 0,
      filmBurn: selectedFilter?.filmBurn ?? 0,
      scanLines: selectedFilter?.scanLines ?? 0,
      // Camera system signature
      microContrast: selectedFilter?.microContrast ?? 0,
      highlightRolloff: selectedFilter?.highlightRolloff ?? 0,
      portraitGlow: selectedFilter?.portraitGlow ?? 0,
      splitToneShadow: selectedFilter?.splitToneShadowHue ?? 0,
      splitToneHighlight: selectedFilter?.splitToneHighlightHue ?? 0,
    };
    commitState({ filterId, filterIntensity: 100, adjustments: newAdjustments });
  };

  const handleAutoEnhance = () => {
    const enhanced: Adjustments = {
      ...adjustments,
      vibrance: Math.min(100, adjustments.vibrance + 25),
      shadows: Math.min(100, adjustments.shadows + 18),
      highlights: Math.max(-100, adjustments.highlights - 10),
      clarity: Math.min(100, adjustments.clarity + 12),
      sharpness: Math.min(100, adjustments.sharpness + 20),
      vignette: Math.max(adjustments.vignette, 12),
      warmth: Math.min(100, adjustments.warmth + 5),
    };
    commitState({ filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: enhanced });
  };

  const activeFilter = FILTERS.find((f) => f.id === activeFilterId) || FILTERS[0];

  // Build preview filter string with CA + dispersion drop-shadows
  const previewFilter = (() => {
    if (isComparing) return 'none';
    let f = getAdjustmentCss(adjustments);
    if (adjustments.chromaticAberration > 0) {
      const offset = adjustments.chromaticAberration * 0.18;
      const alpha = Math.min(adjustments.chromaticAberration / 100 * 0.55, 0.5);
      f += ` drop-shadow(${offset}px 0 0 rgba(255,20,20,${alpha})) drop-shadow(${-offset}px 0 0 rgba(20,20,255,${alpha}))`;
    }
    if (adjustments.dispersion > 0) {
      const offset = adjustments.dispersion * 0.15;
      const alpha = Math.min(adjustments.dispersion / 100 * 0.4, 0.35);
      f += ` drop-shadow(${offset}px ${offset}px 0 rgba(255,20,20,${alpha})) drop-shadow(${-offset}px ${-offset}px 0 rgba(20,20,255,${alpha}))`;
    }
    return f;
  })();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = imageSrc; });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get 2d context");

      // Step 1: Composite base + film filter
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height;
      const cCtx = compositeCanvas.getContext('2d')!;
      cCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if (activeFilter.css !== 'none' && filterIntensity > 0) {
        cCtx.globalAlpha = filterIntensity / 100;
        cCtx.filter = activeFilter.css;
        cCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cCtx.globalAlpha = 1.0;
        cCtx.filter = 'none';
      }

      // Step 2: Apply adjustments to composite
      ctx.filter = getAdjustmentCss(adjustments) || 'none';
      ctx.drawImage(compositeCanvas, 0, 0);
      ctx.filter = 'none';

      // Sharpness (unsharp mask)
      if (adjustments.sharpness > 0) {
        const amt = adjustments.sharpness / 100;
        const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
        const t = tmp.getContext('2d')!;
        t.filter = `blur(${1 + amt}px)`; t.drawImage(canvas, 0, 0); t.filter = 'none';
        const o = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const b = t.getImageData(0, 0, canvas.width, canvas.height);
        const r = ctx.createImageData(canvas.width, canvas.height);
        const str = amt * 1.5;
        for (let i = 0; i < o.data.length; i += 4) {
          for (let ch = 0; ch < 3; ch++) { const d = o.data[i+ch] - b.data[i+ch]; r.data[i+ch] = Math.min(255, Math.max(0, o.data[i+ch] + d * str)); }
          r.data[i+3] = o.data[i+3];
        }
        ctx.putImageData(r, 0, 0);
      }

      // Detail (local contrast)
      if (adjustments.detail > 0) {
        const amt = adjustments.detail / 100;
        const tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
        const t = tmp.getContext('2d')!;
        t.filter = `blur(${3 + amt * 2}px)`; t.drawImage(canvas, 0, 0); t.filter = 'none';
        const o = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const b = t.getImageData(0, 0, canvas.width, canvas.height);
        const r = ctx.createImageData(canvas.width, canvas.height);
        const str = amt * 0.8;
        for (let i = 0; i < o.data.length; i += 4) {
          for (let ch = 0; ch < 3; ch++) { const d = o.data[i+ch] - b.data[i+ch]; r.data[i+ch] = Math.min(255, Math.max(0, o.data[i+ch] + d * str)); }
          r.data[i+3] = o.data[i+3];
        }
        ctx.putImageData(r, 0, 0);
      }

      // Micro-Contrast (Leica/Hasselblad signature: S-curve on luminance, 3D pop)
      if (adjustments.microContrast > 0) {
        const strength = (adjustments.microContrast / 100) * 0.38;
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < d.data.length; i += 4) {
          for (let ch = 0; ch < 3; ch++) {
            const v = d.data[i + ch] / 255;
            // Midtone-focused S-curve: boosts contrast around 0.5 while preserving shadows/highlights
            const curved = v + strength * (v - 0.5) * (1 - Math.pow(Math.abs(v - 0.5) * 1.8, 1.4));
            d.data[i + ch] = Math.min(255, Math.max(0, curved * 255));
          }
        }
        ctx.putImageData(d, 0, 0);
      }

      // Highlight Rolloff (gentle shoulder compression — film/Leica character)
      if (adjustments.highlightRolloff > 0) {
        const rolloff = (adjustments.highlightRolloff / 100) * 0.72;
        const threshold = 0.72; // start compressing above 72% luminance
        const range = 1 - threshold;
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < d.data.length; i += 4) {
          for (let ch = 0; ch < 3; ch++) {
            const v = d.data[i + ch] / 255;
            if (v > threshold) {
              const excess = v - threshold;
              // Smooth shoulder: exponential curve that gently compresses into white
              const compressed = threshold + range * (1 - Math.exp(-excess / range * (1.8 - rolloff * 1.2)));
              d.data[i + ch] = Math.min(255, Math.max(0, compressed * 255));
            }
          }
        }
        ctx.putImageData(d, 0, 0);
      }

      // Portrait Glow (warm skin-tone enhancing glow — Leica/Hasselblad portrait mode)
      if (adjustments.portraitGlow > 0) {
        const amt = adjustments.portraitGlow / 100;
        const pgc = document.createElement('canvas'); pgc.width = canvas.width; pgc.height = canvas.height;
        const pgx = pgc.getContext('2d')!;
        pgx.filter = `blur(${8 + amt * 18}px) brightness(1.2) saturate(1.3)`;
        pgx.drawImage(canvas, 0, 0); pgx.filter = 'none';
        // Warm tint overlay on the glow
        pgx.globalCompositeOperation = 'multiply';
        pgx.fillStyle = `rgba(255, 220, 170, ${0.3 + amt * 0.2})`;
        pgx.fillRect(0, 0, pgc.width, pgc.height);
        pgx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = amt * 0.32;
        ctx.drawImage(pgc, 0, 0);
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
      }

      // Posterize (colour level reduction)
      if (adjustments.posterize > 0) {
        const levels = Math.max(2, Math.round(16 - (adjustments.posterize / 100) * 14));
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const step = 255 / (levels - 1);
        for (let i = 0; i < d.data.length; i += 4) {
          d.data[i]   = Math.round(Math.round(d.data[i]   / step) * step);
          d.data[i+1] = Math.round(Math.round(d.data[i+1] / step) * step);
          d.data[i+2] = Math.round(Math.round(d.data[i+2] / step) * step);
        }
        ctx.putImageData(d, 0, 0);
      }

      // Bloom
      if (adjustments.bloom > 0) {
        const amt = adjustments.bloom / 100;
        const bc = document.createElement('canvas'); bc.width = canvas.width; bc.height = canvas.height;
        const bx = bc.getContext('2d')!;
        bx.filter = `brightness(1.5) blur(${10 + amt * 20}px)`; bx.drawImage(canvas, 0, 0); bx.filter = 'none';
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.4;
        ctx.drawImage(bc, 0, 0);
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
      }

      // Halation
      if (adjustments.halation > 0) {
        const amt = adjustments.halation / 100;
        const hc = document.createElement('canvas'); hc.width = canvas.width; hc.height = canvas.height;
        const hx = hc.getContext('2d')!;
        hx.filter = `brightness(1.3) blur(${15 + amt * 25}px) saturate(1.5) hue-rotate(-15deg)`;
        hx.drawImage(canvas, 0, 0); hx.filter = 'none';
        hx.globalCompositeOperation = 'multiply';
        hx.fillStyle = 'rgba(255, 120, 60, 0.6)'; hx.fillRect(0, 0, hc.width, hc.height);
        hx.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.5;
        ctx.drawImage(hc, 0, 0);
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
      }

      // Soft Focus (dreamy glow: blurred bright version blended with screen)
      if (adjustments.softFocus > 0) {
        const amt = adjustments.softFocus / 100;
        const sc = document.createElement('canvas'); sc.width = canvas.width; sc.height = canvas.height;
        const sx = sc.getContext('2d')!;
        sx.filter = `blur(${3 + amt * 14}px) brightness(1.12)`;
        sx.drawImage(canvas, 0, 0); sx.filter = 'none';
        ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = amt * 0.48;
        ctx.drawImage(sc, 0, 0);
        ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';
      }

      // Chromatic Aberration (true RGB channel split)
      if (adjustments.chromaticAberration > 0) {
        const shift = Math.round(canvas.width * (adjustments.chromaticAberration / 100) * 0.006);
        if (shift > 0) {
          const o = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const r = ctx.createImageData(canvas.width, canvas.height);
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const rx = Math.min(canvas.width - 1, x + shift); const ri = (y * canvas.width + rx) * 4;
              const bx = Math.max(0, x - shift); const bi = (y * canvas.width + bx) * 4;
              r.data[i] = o.data[ri]; r.data[i+1] = o.data[i+1]; r.data[i+2] = o.data[bi+2]; r.data[i+3] = o.data[i+3];
            }
          }
          ctx.putImageData(r, 0, 0);
        }
      }

      // Dispersion (radial prismatic RGB spread)
      if (adjustments.dispersion > 0) {
        const amt = adjustments.dispersion / 100;
        const maxShift = Math.round(canvas.width * amt * 0.008);
        if (maxShift > 0) {
          const cx2 = canvas.width / 2, cy2 = canvas.height / 2;
          const o = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const r = ctx.createImageData(canvas.width, canvas.height);
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const dx = (x - cx2) / cx2, dy = (y - cy2) / cy2;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const s = Math.round(maxShift * dist);
              const rx = Math.min(canvas.width-1, Math.max(0, x + Math.round(dx * s)));
              const ry = Math.min(canvas.height-1, Math.max(0, y + Math.round(dy * s)));
              const ri = (ry * canvas.width + rx) * 4;
              const bxp = Math.min(canvas.width-1, Math.max(0, x - Math.round(dx * s)));
              const byp = Math.min(canvas.height-1, Math.max(0, y - Math.round(dy * s)));
              const bi = (byp * canvas.width + bxp) * 4;
              r.data[i] = o.data[ri]; r.data[i+1] = o.data[i+1]; r.data[i+2] = o.data[bi+2]; r.data[i+3] = o.data[i+3];
            }
          }
          ctx.putImageData(r, 0, 0);
        }
      }

      // Split Tone Shadow (tint dark regions with chosen hue)
      if (adjustments.splitToneShadow !== 0) {
        const rgb = hueToRgb(adjustments.splitToneShadow);
        const alpha = 0.18;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Split Tone Highlight (tint bright regions with chosen hue)
      if (adjustments.splitToneHighlight !== 0) {
        const rgb = hueToRgb(adjustments.splitToneHighlight);
        const alpha = 0.15;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Film tint overlay
      if (activeFilter.tintOverlay) {
        ctx.fillStyle = activeFilter.tintOverlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Shadow tint (multiply blend)
      if (activeFilter.shadowTint) {
        const sc2 = document.createElement('canvas'); sc2.width = canvas.width; sc2.height = canvas.height;
        const sx2 = sc2.getContext('2d')!;
        const grad = sx2.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width*0.2, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)*0.9);
        grad.addColorStop(0, 'rgba(255,255,255,0.97)'); grad.addColorStop(1, activeFilter.shadowTint);
        sx2.fillStyle = grad; sx2.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(sc2, 0, 0); ctx.globalCompositeOperation = 'source-over';
      }

      // Burn edges (multiply)
      if (activeFilter.burnEdges && activeFilter.burnEdges > 0) {
        const bc2 = document.createElement('canvas'); bc2.width = canvas.width; bc2.height = canvas.height;
        const bx2 = bc2.getContext('2d')!;
        const grad = bx2.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width*0.28, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)*0.82);
        grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(1, `rgba(0,0,0,${(activeFilter.burnEdges/100)*0.88})`);
        bx2.fillStyle = grad; bx2.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(bc2, 0, 0); ctx.globalCompositeOperation = 'source-over';
      }

      // Fade (shadow lift)
      if (adjustments.fade > 0) {
        ctx.fillStyle = `rgba(50,50,50,${adjustments.fade/100})`;
        ctx.globalCompositeOperation = 'lighten'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'source-over';
      }

      // Vignette
      if (adjustments.vignette > 0) {
        const g = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/1.2);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${adjustments.vignette/100})`);
        ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Grain (overlay blend)
      if (adjustments.grain > 0) {
        const nc = document.createElement('canvas'); nc.width = 512; nc.height = 512;
        const nx = nc.getContext('2d')!;
        const nd = nx.createImageData(512, 512);
        for (let i = 0; i < nd.data.length; i += 4) {
          const v = Math.random() * 255; nd.data[i] = v; nd.data[i+1] = v; nd.data[i+2] = v; nd.data[i+3] = (adjustments.grain/100)*60;
        }
        nx.putImageData(nd, 0, 0);
        ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = ctx.createPattern(nc, 'repeat')!;
        ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'source-over';
      }

      // Light Leak (top-left)
      if (adjustments.lightLeak > 0) {
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.6);
        rg.addColorStop(0, `rgba(255,60,0,${(adjustments.lightLeak/100)*0.8})`);
        rg.addColorStop(0.5, `rgba(255,120,0,${(adjustments.lightLeak/100)*0.4})`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        const lg = ctx.createLinearGradient(0, 0, canvas.width * 0.2, 0);
        lg.addColorStop(0, `rgba(255,30,0,${(adjustments.lightLeak/100)*0.3})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = rg; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = lg; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Film Burn (bottom-right warm leak)
      if (adjustments.filmBurn > 0) {
        const rg = ctx.createRadialGradient(canvas.width, canvas.height, 0, canvas.width, canvas.height, canvas.width * 0.6);
        rg.addColorStop(0, `rgba(255,200,50,${(adjustments.filmBurn/100)*0.8})`);
        rg.addColorStop(0.5, `rgba(255,100,0,${(adjustments.filmBurn/100)*0.4})`);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        const lg = ctx.createLinearGradient(0, canvas.height, 0, canvas.height * 0.8);
        lg.addColorStop(0, `rgba(255,180,30,${(adjustments.filmBurn/100)*0.25})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = rg; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = lg; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Dust
      if (adjustments.dust > 0) {
        const dc = document.createElement('canvas'); dc.width = 200; dc.height = 200;
        const dx = dc.getContext('2d')!;
        dx.strokeStyle = `rgba(255,255,255,${(adjustments.dust/100)*0.6})`; dx.lineWidth = 1;
        dx.fillStyle = `rgba(255,255,255,${(adjustments.dust/100)*0.5})`;
        dx.beginPath();
        dx.moveTo(10,20); dx.lineTo(15,25); dx.moveTo(180,150); dx.lineTo(185,145);
        dx.moveTo(50,80); dx.lineTo(52,85); dx.moveTo(120,30); dx.lineTo(125,35);
        dx.moveTo(30,170); dx.lineTo(35,165); dx.moveTo(160,50); dx.lineTo(165,55);
        dx.moveTo(90,120); dx.lineTo(92,125); dx.stroke();
        dx.beginPath(); dx.arc(40,40,1,0,Math.PI*2); dx.fill();
        dx.beginPath(); dx.arc(150,100,2,0,Math.PI*2); dx.fill();
        dx.beginPath(); dx.arc(80,160,1.5,0,Math.PI*2); dx.fill();
        dx.beginPath(); dx.arc(110,20,2.5,0,Math.PI*2); dx.fill();
        dx.beginPath(); dx.arc(20,130,1.2,0,Math.PI*2); dx.fill();
        dx.beginPath(); dx.arc(180,180,1.8,0,Math.PI*2); dx.fill();
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = ctx.createPattern(dc, 'repeat')!;
        ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalCompositeOperation = 'source-over';
      }

      // Scan Lines
      if (adjustments.scanLines > 0) {
        const alpha = (adjustments.scanLines / 100) * 0.35;
        ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        for (let y = 0; y < canvas.height; y += 4) { ctx.fillRect(0, y + 2, canvas.width, 2); }
      }

      // Pixelate (last — pixelates everything including effects)
      if (adjustments.pixelate > 0) {
        const blockSize = Math.max(2, Math.round((adjustments.pixelate / 100) * 30));
        const w = Math.ceil(canvas.width / blockSize), h = Math.ceil(canvas.height / blockSize);
        const tc = document.createElement('canvas'); tc.width = w; tc.height = h;
        const tx = tc.getContext('2d')!;
        tx.drawImage(canvas, 0, 0, w, h);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tc, 0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
      }

      const filteredImageSrc = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = filteredImageSrc;
      link.download = `fuads-studio-${activeFilter.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#030303] flex flex-col font-sans">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex-1 flex justify-start">
          <button onClick={onClose} className="p-2.5 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10">
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 flex justify-center space-x-2">
          <button onClick={undo} disabled={!canUndo} className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10" title="Undo">
            <Undo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onPointerDown={() => setIsComparing(true)} onPointerUp={() => setIsComparing(false)} onPointerLeave={() => setIsComparing(false)} onContextMenu={(e) => e.preventDefault()} className={`p-2.5 transition-all rounded-full backdrop-blur-xl border border-white/10 ${isComparing ? 'bg-white text-black' : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'}`} title="Hold to compare">
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={redo} disabled={!canRedo} className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10" title="Redo">
            <Redo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex-1 flex justify-end space-x-3 items-center">
          <button onClick={handleAutoEnhance} className="p-2.5 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10" title="Auto Enhance">
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={handleExport} disabled={isExporting} className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-50 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10" title="Export to Device">
            <Download className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button onClick={() => onSave(activeFilterId, filterIntensity, adjustments)} className="px-6 py-2.5 rounded-full bg-white text-black text-xs uppercase tracking-widest font-semibold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]">
            Save
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 bg-[#030303]">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />
        <div className="relative max-w-full max-h-full rounded-sm overflow-hidden shadow-2xl flex items-center justify-center ring-1 ring-white/5">

          {/* Image with CSS adjustments + CA/dispersion drop-shadows */}
          <div className="relative w-full h-full flex items-center justify-center" style={{ filter: previewFilter }}>
            <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain" />
            {!isComparing && activeFilter.css !== 'none' && (
              <img src={imageSrc} alt="Preview Filtered" className="absolute inset-0 w-full h-full object-contain" style={{ filter: activeFilter.css, opacity: filterIntensity / 100 }} />
            )}
          </div>

          {/* === OVERLAY EFFECTS === */}

          {/* Film tint overlay */}
          {!isComparing && activeFilter.tintOverlay && (
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: activeFilter.tintOverlay }} />
          )}

          {/* Shadow tint */}
          {!isComparing && activeFilter.shadowTint && (
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ background: `radial-gradient(ellipse at center, rgba(255,255,255,0.97) 20%, ${activeFilter.shadowTint} 100%)` }} />
          )}

          {/* Burn edges */}
          {!isComparing && activeFilter.burnEdges && activeFilter.burnEdges > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ background: `radial-gradient(circle, rgba(255,255,255,1) 30%, rgba(0,0,0,${(activeFilter.burnEdges / 100) * 0.88}) 100%)` }} />
          )}

          {/* Split Tone Shadow — multiply tints dark regions */}
          {!isComparing && adjustments.splitToneShadow !== 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-multiply" style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneShadow)}, 0.18)` }} />
          )}

          {/* Split Tone Highlight — screen tints bright regions */}
          {!isComparing && adjustments.splitToneHighlight !== 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneHighlight)}, 0.15)` }} />
          )}

          {/* Portrait Glow — warm skin-tone enhancing glow */}
          {!isComparing && adjustments.portraitGlow > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{
              backdropFilter: `blur(${(adjustments.portraitGlow / 100) * 18}px) brightness(1.2) saturate(1.3)`,
              backgroundColor: `rgba(255, 210, 155, ${(adjustments.portraitGlow / 100) * 0.10})`,
              opacity: (adjustments.portraitGlow / 100) * 0.32
            }} />
          )}

          {/* Soft Focus — dreamy screen-blended glow */}
          {!isComparing && adjustments.softFocus > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ backdropFilter: `blur(${(adjustments.softFocus / 100) * 14}px) brightness(1.12)`, opacity: (adjustments.softFocus / 100) * 0.48, background: 'rgba(255,255,255,0.04)' }} />
          )}

          {/* Fade */}
          {!isComparing && adjustments.fade > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-lighten" style={{ backgroundColor: `rgba(50,50,50,${adjustments.fade / 100})` }} />
          )}

          {/* Vignette */}
          {!isComparing && adjustments.vignette > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${adjustments.vignette / 100}))` }} />
          )}

          {/* Grain */}
          {!isComparing && adjustments.grain > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, opacity: (adjustments.grain / 100) * 0.6 }} />
          )}

          {/* Light Leak (top-left) */}
          {!isComparing && adjustments.lightLeak > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(circle at 0% 0%, rgba(255,60,0,${(adjustments.lightLeak/100)*0.8}) 0%, rgba(255,120,0,${(adjustments.lightLeak/100)*0.4}) 30%, transparent 60%), linear-gradient(90deg, rgba(255,30,0,${(adjustments.lightLeak/100)*0.3}) 0%, transparent 20%)` }} />
          )}

          {/* Film Burn (bottom-right warm glow) */}
          {!isComparing && adjustments.filmBurn > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(circle at 100% 100%, rgba(255,200,50,${(adjustments.filmBurn/100)*0.8}) 0%, rgba(255,100,0,${(adjustments.filmBurn/100)*0.4}) 30%, transparent 60%), linear-gradient(0deg, rgba(255,180,30,${(adjustments.filmBurn/100)*0.25}) 0%, transparent 20%)` }} />
          )}

          {/* Dust */}
          {!isComparing && adjustments.dust > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10,20 L15,25 M180,150 L185,145 M50,80 L52,85 M120,30 L125,35 M30,170 L35,165 M160,50 L165,55 M90,120 L92,125' stroke='white' stroke-width='0.5' fill='none' opacity='0.6'/%3E%3Ccircle cx='40' cy='40' r='0.5' fill='white' opacity='0.5'/%3E%3Ccircle cx='150' cy='100' r='1' fill='white' opacity='0.4'/%3E%3Ccircle cx='80' cy='160' r='0.8' fill='white' opacity='0.6'/%3E%3Ccircle cx='110' cy='20' r='1.2' fill='white' opacity='0.3'/%3E%3Ccircle cx='20' cy='130' r='0.6' fill='white' opacity='0.7'/%3E%3Ccircle cx='180' cy='180' r='0.9' fill='white' opacity='0.5'/%3E%3C/svg%3E")`, opacity: (adjustments.dust/100)*0.8, backgroundSize: '150px 150px' }} />
          )}

          {/* Bloom */}
          {!isComparing && adjustments.bloom > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(ellipse at center, rgba(255,255,255,${(adjustments.bloom/100)*0.25}) 0%, transparent 70%)`, backdropFilter: `blur(${(adjustments.bloom/100)*15}px) brightness(1.2)`, opacity: (adjustments.bloom/100)*0.6 }} />
          )}

          {/* Halation */}
          {!isComparing && adjustments.halation > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(ellipse at 50% 50%, rgba(255,100,40,${(adjustments.halation/100)*0.3}) 0%, rgba(255,60,20,${(adjustments.halation/100)*0.15}) 40%, transparent 70%)`, opacity: (adjustments.halation/100)*0.7 }} />
          )}

          {/* Scan Lines */}
          {!isComparing && adjustments.scanLines > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,${(adjustments.scanLines/100)*0.4}) 2px, rgba(0,0,0,${(adjustments.scanLines/100)*0.4}) 4px)`, opacity: (adjustments.scanLines/100)*0.8 }} />
          )}

          {/* Posterize — contrast bump proxy for preview */}
          {!isComparing && adjustments.posterize > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay" style={{ background: `linear-gradient(135deg, rgba(0,0,0,${(adjustments.posterize/100)*0.15}) 0%, rgba(255,255,255,${(adjustments.posterize/100)*0.08}) 100%)` }} />
          )}

        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-[#030303] rounded-t-[2rem] border-t border-white/5 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col relative z-30">
        <div className="flex justify-center pt-6 pb-2">
          <div className="flex bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 relative">
            {['presets', 'adjust'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as 'presets' | 'adjust')} className={`relative px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 z-10 ${activeTab === tab ? 'text-black' : 'text-zinc-500 hover:text-white'}`}>
                {activeTab === tab && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72 relative">
          {activeTab === 'presets' ? (
            <FilterCarousel activeFilterId={activeFilterId} onSelectFilter={handleFilterSelect} previewImage={imageSrc} filterIntensity={filterIntensity} onIntensityChange={handleIntensityChange} adjustments={adjustments} onAdjustmentChange={handleAdjustmentChange} />
          ) : (
            <AdjustmentsPanel adjustments={adjustments} onChange={handleAdjustmentChange} />
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
