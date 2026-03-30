import React, { useRef, useState } from 'react';
import { Download, ChevronLeft, SlidersHorizontal, Image as ImageIcon, Undo2, Redo2, Eye, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { FILTERS } from '../lib/filters';
import FilterCarousel from './FilterCarousel';
import AdjustmentsPanel from './AdjustmentsPanel';
import { Adjustments } from '../types';
import { getAdjustmentCss } from '../lib/utils';

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

  const undo = () => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
      setDraftState(null);
    }
  };

  const redo = () => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
      setDraftState(null);
    }
  };

  const handleAdjustmentChange = (newAdj: Adjustments, isFinal: boolean = false) => {
    if (isFinal) {
      const newState = { filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj };
      const committedState = history[currentIndex];
      if (JSON.stringify(committedState.adjustments) === JSON.stringify(newAdj) && committedState.filterId === newState.filterId && committedState.filterIntensity === newState.filterIntensity) {
        setDraftState(null);
        return;
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
        setDraftState(null);
        return;
      }
      commitState(newState);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: newIntensity, adjustments: currentState.adjustments });
    }
  };

  const handleFilterSelect = (filterId: string) => {
    if (filterId === currentState.filterId) return;

    const selectedFilter = FILTERS.find(f => f.id === filterId);

    // Auto-apply analog characteristics from the selected filter
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
    };

    commitState({ filterId, filterIntensity: 100, adjustments: newAdjustments });
  };

  // Auto Enhance: apply a set of smart beautification adjustments
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get 2d context");

      // Step 1: Composite base + film filter on an off-screen canvas
      // This matches the preview exactly: base image + filter layer at filterIntensity opacity
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = canvas.width;
      compositeCanvas.height = canvas.height;
      const cCtx = compositeCanvas.getContext('2d');
      if (!cCtx) throw new Error("Could not get composite 2d context");

      // Draw base image (no filter)
      cCtx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blend film filter on top at filterIntensity opacity
      if (activeFilter.css !== 'none' && filterIntensity > 0) {
        cCtx.globalAlpha = filterIntensity / 100;
        cCtx.filter = activeFilter.css;
        cCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
        cCtx.globalAlpha = 1.0;
        cCtx.filter = 'none';
      }

      // Step 2: Draw composite onto main canvas with adjustment filters applied once
      ctx.filter = getAdjustmentCss(adjustments) || 'none';
      ctx.drawImage(compositeCanvas, 0, 0);
      ctx.filter = 'none';

      // Apply Sharpness (unsharp mask technique)
      if (adjustments.sharpness > 0) {
        const sharpAmount = adjustments.sharpness / 100;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
          tCtx.filter = `blur(${1 + sharpAmount}px)`;
          tCtx.drawImage(canvas, 0, 0);
          tCtx.filter = 'none';
          const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const blurData = tCtx.getImageData(0, 0, canvas.width, canvas.height);
          const resultData = ctx.createImageData(canvas.width, canvas.height);
          const strength = sharpAmount * 1.5;
          for (let i = 0; i < origData.data.length; i += 4) {
            for (let ch = 0; ch < 3; ch++) {
              const diff = origData.data[i + ch] - blurData.data[i + ch];
              resultData.data[i + ch] = Math.min(255, Math.max(0, origData.data[i + ch] + diff * strength));
            }
            resultData.data[i + 3] = origData.data[i + 3];
          }
          ctx.putImageData(resultData, 0, 0);
        }
      }

      // Apply Detail (local contrast enhancement at fine scale)
      if (adjustments.detail > 0) {
        const detailAmount = adjustments.detail / 100;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
          tCtx.filter = `blur(${3 + detailAmount * 2}px)`;
          tCtx.drawImage(canvas, 0, 0);
          tCtx.filter = 'none';
          const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const blurData = tCtx.getImageData(0, 0, canvas.width, canvas.height);
          const resultData = ctx.createImageData(canvas.width, canvas.height);
          const strength = detailAmount * 0.8;
          for (let i = 0; i < origData.data.length; i += 4) {
            for (let ch = 0; ch < 3; ch++) {
              const diff = origData.data[i + ch] - blurData.data[i + ch];
              resultData.data[i + ch] = Math.min(255, Math.max(0, origData.data[i + ch] + diff * strength));
            }
            resultData.data[i + 3] = origData.data[i + 3];
          }
          ctx.putImageData(resultData, 0, 0);
        }
      }

      // Apply Bloom (soft glow on highlights)
      if (adjustments.bloom > 0) {
        const bloomAmount = adjustments.bloom / 100;
        const bloomCanvas = document.createElement('canvas');
        bloomCanvas.width = canvas.width;
        bloomCanvas.height = canvas.height;
        const bCtx = bloomCanvas.getContext('2d');
        if (bCtx) {
          bCtx.filter = `brightness(1.5) blur(${10 + bloomAmount * 20}px)`;
          bCtx.drawImage(canvas, 0, 0);
          bCtx.filter = 'none';
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = bloomAmount * 0.4;
          ctx.drawImage(bloomCanvas, 0, 0);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Apply Halation (warm color bleed around bright areas — characteristic of CineStill)
      if (adjustments.halation > 0) {
        const halAmount = adjustments.halation / 100;
        const halCanvas = document.createElement('canvas');
        halCanvas.width = canvas.width;
        halCanvas.height = canvas.height;
        const hCtx = halCanvas.getContext('2d');
        if (hCtx) {
          hCtx.filter = `brightness(1.3) blur(${15 + halAmount * 25}px) saturate(1.5) hue-rotate(-15deg)`;
          hCtx.drawImage(canvas, 0, 0);
          hCtx.filter = 'none';
          hCtx.globalCompositeOperation = 'multiply';
          hCtx.fillStyle = 'rgba(255, 120, 60, 0.6)';
          hCtx.fillRect(0, 0, halCanvas.width, halCanvas.height);
          hCtx.globalCompositeOperation = 'source-over';
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = halAmount * 0.5;
          ctx.drawImage(halCanvas, 0, 0);
          ctx.globalAlpha = 1.0;
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Apply chromatic aberration (true RGB channel split)
      if (adjustments.chromaticAberration > 0) {
        const shift = Math.round(canvas.width * (adjustments.chromaticAberration / 100) * 0.006);
        if (shift > 0) {
          const origData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = ctx.createImageData(canvas.width, canvas.height);
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              const i = (y * canvas.width + x) * 4;
              const rx = Math.min(canvas.width - 1, x + shift);
              const ri = (y * canvas.width + rx) * 4;
              const bx = Math.max(0, x - shift);
              const bi = (y * canvas.width + bx) * 4;
              result.data[i]   = origData.data[ri];      // R shifted right
              result.data[i+1] = origData.data[i+1];    // G unchanged
              result.data[i+2] = origData.data[bi+2];   // B shifted left
              result.data[i+3] = origData.data[i+3];
            }
          }
          ctx.putImageData(result, 0, 0);
        }
      }

      // Apply film tint overlay (subtle color cast characteristic of each film stock)
      if (activeFilter.tintOverlay) {
        ctx.fillStyle = activeFilter.tintOverlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Apply shadow tint via multiply blend
      if (activeFilter.shadowTint) {
        const stCanvas = document.createElement('canvas');
        stCanvas.width = canvas.width;
        stCanvas.height = canvas.height;
        const sCtx = stCanvas.getContext('2d');
        if (sCtx) {
          const grad = sCtx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.2,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.9
          );
          grad.addColorStop(0, 'rgba(255,255,255,0.97)');
          grad.addColorStop(1, activeFilter.shadowTint);
          sCtx.fillStyle = grad;
          sCtx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(stCanvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Apply burn edges (aggressive colour-burn darkening)
      if (activeFilter.burnEdges && activeFilter.burnEdges > 0) {
        const beCanvas = document.createElement('canvas');
        beCanvas.width = canvas.width;
        beCanvas.height = canvas.height;
        const bCtx = beCanvas.getContext('2d');
        if (bCtx) {
          const grad = bCtx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.28,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.82
          );
          grad.addColorStop(0, 'rgba(255,255,255,1)');
          grad.addColorStop(1, `rgba(0,0,0,${(activeFilter.burnEdges / 100) * 0.88})`);
          bCtx.fillStyle = grad;
          bCtx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(beCanvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Apply Fade Overlay (lifts shadows, simulates film base fog)
      if (adjustments.fade > 0) {
        ctx.fillStyle = `rgba(50, 50, 50, ${adjustments.fade / 100})`;
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Apply Vignette
      if (adjustments.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Apply Grain with overlay blend for realistic film grain
      if (adjustments.grain > 0) {
        const noiseCanvas = document.createElement('canvas');
        noiseCanvas.width = 512;
        noiseCanvas.height = 512;
        const nCtx = noiseCanvas.getContext('2d');
        if (nCtx) {
          const imgData = nCtx.createImageData(512, 512);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const val = Math.random() * 255;
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            data[i+3] = (adjustments.grain / 100) * 60;
          }
          nCtx.putImageData(imgData, 0, 0);
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = ctx.createPattern(noiseCanvas, 'repeat')!;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
      }

      // Apply Light Leak
      if (adjustments.lightLeak > 0) {
        const rGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, canvas.width * 0.6);
        rGradient.addColorStop(0, `rgba(255, 60, 0, ${(adjustments.lightLeak / 100) * 0.8})`);
        rGradient.addColorStop(0.5, `rgba(255, 120, 0, ${(adjustments.lightLeak / 100) * 0.4})`);
        rGradient.addColorStop(1, 'rgba(0,0,0,0)');

        const lGradient = ctx.createLinearGradient(0, 0, canvas.width * 0.2, 0);
        lGradient.addColorStop(0, `rgba(255, 30, 0, ${(adjustments.lightLeak / 100) * 0.3})`);
        lGradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = rGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = lGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Apply Dust
      if (adjustments.dust > 0) {
        const dustCanvas = document.createElement('canvas');
        dustCanvas.width = 200;
        dustCanvas.height = 200;
        const dCtx = dustCanvas.getContext('2d');
        if (dCtx) {
          dCtx.strokeStyle = `rgba(255,255,255,${(adjustments.dust / 100) * 0.6})`;
          dCtx.lineWidth = 1;
          dCtx.fillStyle = `rgba(255,255,255,${(adjustments.dust / 100) * 0.5})`;

          dCtx.beginPath();
          dCtx.moveTo(10, 20); dCtx.lineTo(15, 25);
          dCtx.moveTo(180, 150); dCtx.lineTo(185, 145);
          dCtx.moveTo(50, 80); dCtx.lineTo(52, 85);
          dCtx.moveTo(120, 30); dCtx.lineTo(125, 35);
          dCtx.moveTo(30, 170); dCtx.lineTo(35, 165);
          dCtx.moveTo(160, 50); dCtx.lineTo(165, 55);
          dCtx.moveTo(90, 120); dCtx.lineTo(92, 125);
          dCtx.stroke();

          dCtx.beginPath(); dCtx.arc(40, 40, 1, 0, Math.PI*2); dCtx.fill();
          dCtx.beginPath(); dCtx.arc(150, 100, 2, 0, Math.PI*2); dCtx.fill();
          dCtx.beginPath(); dCtx.arc(80, 160, 1.5, 0, Math.PI*2); dCtx.fill();
          dCtx.beginPath(); dCtx.arc(110, 20, 2.5, 0, Math.PI*2); dCtx.fill();
          dCtx.beginPath(); dCtx.arc(20, 130, 1.2, 0, Math.PI*2); dCtx.fill();
          dCtx.beginPath(); dCtx.arc(180, 180, 1.8, 0, Math.PI*2); dCtx.fill();

          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = ctx.createPattern(dustCanvas, 'repeat')!;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';
        }
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
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
            onContextMenu={(e) => e.preventDefault()}
            className={`p-2.5 transition-all rounded-full backdrop-blur-xl border border-white/10 ${isComparing ? 'bg-white text-black' : 'text-white/70 hover:text-white bg-white/5 hover:bg-white/10'}`}
            title="Hold to compare"
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 flex justify-end space-x-3 items-center">
          <button
            onClick={handleAutoEnhance}
            className="p-2.5 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Auto Enhance"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2.5 text-white/70 hover:text-white transition-all disabled:opacity-50 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Export to Device"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onSave(activeFilterId, filterIntensity, adjustments)}
            className="px-6 py-2.5 rounded-full bg-white text-black text-xs uppercase tracking-widest font-semibold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 bg-[#030303]">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />
        <div className="relative max-w-full max-h-full rounded-sm overflow-hidden shadow-2xl flex items-center justify-center ring-1 ring-white/5">
          <div className="relative w-full h-full flex items-center justify-center" style={{ filter: isComparing ? 'none' : (() => {
            const base = getAdjustmentCss(adjustments);
            if (adjustments.chromaticAberration > 0) {
              const offset = adjustments.chromaticAberration * 0.18;
              const alpha = Math.min(adjustments.chromaticAberration / 100 * 0.55, 0.5);
              return `${base} drop-shadow(${offset}px 0 0 rgba(255,20,20,${alpha})) drop-shadow(${-offset}px 0 0 rgba(20,20,255,${alpha}))`;
            }
            return base;
          })() }}>
            <img
              src={imageSrc}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            {!isComparing && activeFilter.css !== 'none' && (
              <img
                src={imageSrc}
                alt="Preview Filtered"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ filter: activeFilter.css, opacity: filterIntensity / 100 }}
              />
            )}
          </div>

          {/* Film tint overlay (subtle per-stock color cast) */}
          {!isComparing && activeFilter.tintOverlay && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: activeFilter.tintOverlay }}
            />
          )}

          {/* Shadow tint — colours shadows via multiply blend */}
          {!isComparing && activeFilter.shadowTint && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.97) 20%, ${activeFilter.shadowTint} 100%)`
              }}
            />
          )}

          {/* Burn edges — aggressive colour-burn darkening at edges */}
          {!isComparing && activeFilter.burnEdges && activeFilter.burnEdges > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply"
              style={{
                background: `radial-gradient(circle, rgba(255,255,255,1) 30%, rgba(0,0,0,${(activeFilter.burnEdges / 100) * 0.88}) 100%)`
              }}
            />
          )}

          {/* Fade overlay (shadow lift / film base fog) */}
          {!isComparing && adjustments.fade > 0 && (
            <div className="absolute inset-0 pointer-events-none mix-blend-lighten" style={{ backgroundColor: `rgba(50, 50, 50, ${adjustments.fade / 100})` }} />
          )}

          {/* Vignette */}
          {!isComparing && adjustments.vignette > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${adjustments.vignette / 100}))` }} />
          )}

          {/* Grain — overlay blend for realistic film grain character */}
          {!isComparing && adjustments.grain > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: (adjustments.grain / 100) * 0.6
              }}
            />
          )}

          {/* Light Leak */}
          {!isComparing && adjustments.lightLeak > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 0% 0%, rgba(255, 60, 0, ${(adjustments.lightLeak / 100) * 0.8}) 0%, rgba(255, 120, 0, ${(adjustments.lightLeak / 100) * 0.4}) 30%, transparent 60%), linear-gradient(90deg, rgba(255, 30, 0, ${(adjustments.lightLeak / 100) * 0.3}) 0%, transparent 20%)`
              }}
            />
          )}

          {/* Dust */}
          {!isComparing && adjustments.dust > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10,20 L15,25 M180,150 L185,145 M50,80 L52,85 M120,30 L125,35 M30,170 L35,165 M160,50 L165,55 M90,120 L92,125' stroke='white' stroke-width='0.5' fill='none' opacity='0.6'/%3E%3Ccircle cx='40' cy='40' r='0.5' fill='white' opacity='0.5'/%3E%3Ccircle cx='150' cy='100' r='1' fill='white' opacity='0.4'/%3E%3Ccircle cx='80' cy='160' r='0.8' fill='white' opacity='0.6'/%3E%3Ccircle cx='110' cy='20' r='1.2' fill='white' opacity='0.3'/%3E%3Ccircle cx='20' cy='130' r='0.6' fill='white' opacity='0.7'/%3E%3Ccircle cx='180' cy='180' r='0.9' fill='white' opacity='0.5'/%3E%3C/svg%3E")`,
                opacity: (adjustments.dust / 100) * 0.8,
                backgroundSize: '150px 150px'
              }}
            />
          )}

          {/* Bloom — soft highlight glow */}
          {!isComparing && adjustments.bloom > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,${(adjustments.bloom / 100) * 0.25}) 0%, transparent 70%)`,
                backdropFilter: `blur(${(adjustments.bloom / 100) * 15}px) brightness(1.2)`,
                opacity: (adjustments.bloom / 100) * 0.6
              }}
            />
          )}

          {/* Halation — warm color bleed around highlights */}
          {!isComparing && adjustments.halation > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(ellipse at 50% 50%, rgba(255, 100, 40, ${(adjustments.halation / 100) * 0.3}) 0%, rgba(255, 60, 20, ${(adjustments.halation / 100) * 0.15}) 40%, transparent 70%)`,
                opacity: (adjustments.halation / 100) * 0.7
              }}
            />
          )}
        </div>
      </div>

      {/* Bottom Controls Area */}
      <div className="bg-[#030303] rounded-t-[2rem] border-t border-white/5 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col relative z-30">
        {/* Segmented Control Tabs */}
        <div className="flex justify-center pt-6 pb-2">
          <div className="flex bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10 relative">
            {['presets', 'adjust'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'presets' | 'adjust')}
                className={`relative px-8 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] font-bold transition-all duration-300 z-10 ${
                  activeTab === tab ? 'text-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Panels */}
        <div className="h-72 relative">
          {activeTab === 'presets' ? (
            <FilterCarousel
              activeFilterId={activeFilterId}
              onSelectFilter={handleFilterSelect}
              previewImage={imageSrc}
              filterIntensity={filterIntensity}
              onIntensityChange={handleIntensityChange}
            />
          ) : (
            <AdjustmentsPanel
              adjustments={adjustments}
              onChange={handleAdjustmentChange}
            />
          )}
        </div>
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
