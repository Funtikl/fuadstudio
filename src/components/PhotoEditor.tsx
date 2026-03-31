import React, { useRef, useState, useEffect } from "react";
import {
  Download,
  ChevronLeft,
  Undo2,
  Redo2,
  Eye,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { FILTERS } from "../lib/filters";
import FilterCarousel from "./FilterCarousel";
import AdjustmentsPanel from "./AdjustmentsPanel";
import { Adjustments } from "../types";
import { getAdjustmentCss, hueToRgb } from "../lib/utils";
import { renderToCanvas } from "../lib/render";

interface PhotoEditorProps {
  imageSrc: string;
  initialFilterId: string;
  initialFilterIntensity: number;
  initialAdjustments: Adjustments;
  onClose: () => void;
  onSave: (
    filterId: string,
    filterIntensity: number,
    adjustments: Adjustments,
  ) => void;
}

interface EditorState {
  filterId: string;
  filterIntensity: number;
  adjustments: Adjustments;
}

export default function PhotoEditor({
  imageSrc,
  initialFilterId,
  initialFilterIntensity,
  initialAdjustments,
  onClose,
  onSave,
}: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "adjust">("presets");
  const [isExporting, setIsExporting] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [renderedPreview, setRenderedPreview] = useState<string | null>(null);
  const renderVersionRef = useRef(0);

  const [history, setHistory] = useState<EditorState[]>([
    {
      filterId: initialFilterId,
      filterIntensity: initialFilterIntensity,
      adjustments: initialAdjustments,
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftState, setDraftState] = useState<EditorState | null>(null);

  const currentState = draftState || history[currentIndex];
  const activeFilterId = currentState.filterId;
  const filterIntensity = currentState.filterIntensity;
  const adjustments = currentState.adjustments;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const activeFilter =
    FILTERS.find((f) => f.id === activeFilterId) || FILTERS[0];

  // Re-render preview whenever a committed change happens
  useEffect(() => {
    if (draftState) return;
    const version = ++renderVersionRef.current;
    const previewCanvas = document.createElement('canvas');
    renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, previewCanvas, 600)
      .then(() => {
        if (renderVersionRef.current !== version) return;
        setRenderedPreview(previewCanvas.toDataURL('image/jpeg', 0.92));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, currentIndex]);

  const commitState = (newState: EditorState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
    setDraftState(null);
  };

  const undo = () => {
    if (canUndo) { setCurrentIndex(currentIndex - 1); setDraftState(null); }
  };
  const redo = () => {
    if (canRedo) { setCurrentIndex(currentIndex + 1); setDraftState(null); }
  };

  const handleAdjustmentChange = (newAdj: Adjustments, isFinal = false) => {
    if (isFinal) {
      const newState = { filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj };
      const committedState = history[currentIndex];
      if (JSON.stringify(committedState.adjustments) === JSON.stringify(newAdj) &&
          committedState.filterId === newState.filterId &&
          committedState.filterIntensity === newState.filterIntensity) {
        setDraftState(null);
        return;
      }
      commitState(newState);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj });
    }
  };

  const handleIntensityChange = (newIntensity: number, isFinal = false) => {
    if (isFinal) {
      const newState = { filterId: currentState.filterId, filterIntensity: newIntensity, adjustments: currentState.adjustments };
      const committedState = history[currentIndex];
      if (committedState.filterIntensity === newIntensity &&
          committedState.filterId === newState.filterId &&
          JSON.stringify(committedState.adjustments) === JSON.stringify(newState.adjustments)) {
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
    const selectedFilter = FILTERS.find((f) => f.id === filterId);
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

  // CSS preview filter
  const previewFilter = (() => {
    if (isComparing) return "none";
    let f = getAdjustmentCss(adjustments);
    if (adjustments.chromaticAberration > 0) {
      const offset = adjustments.chromaticAberration * 0.18;
      const alpha = Math.min((adjustments.chromaticAberration / 100) * 0.55, 0.5);
      f += ` drop-shadow(${offset}px 0 0 rgba(255,20,20,${alpha})) drop-shadow(${-offset}px 0 0 rgba(20,20,255,${alpha}))`;
    }
    if (adjustments.dispersion > 0) {
      const offset = adjustments.dispersion * 0.15;
      const alpha = Math.min((adjustments.dispersion / 100) * 0.4, 0.35);
      f += ` drop-shadow(${offset}px ${offset}px 0 rgba(255,20,20,${alpha})) drop-shadow(${-offset}px ${-offset}px 0 rgba(20,20,255,${alpha}))`;
    }
    return f;
  })();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      await renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, canvas);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `fuads-studio-${activeFilter.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
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
    <div className="relative w-full h-full bg-[#030303] flex flex-col font-sans overflow-hidden">

      {/* ─── Top Bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 relative z-20 flex justify-between items-center px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-5">
        {/* Left: back */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 text-white/60 active:text-white active:scale-90 transition-all rounded-full bg-white/5 active:bg-white/15"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Center: undo / compare / redo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2 text-white/60 active:text-white active:scale-90 transition-all disabled:opacity-20 rounded-full bg-white/5 active:bg-white/15"
          >
            <Undo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
            onContextMenu={(e) => e.preventDefault()}
            className={`p-2 transition-all active:scale-90 rounded-full ${
              isComparing ? "bg-white text-black" : "text-white/60 bg-white/5 active:bg-white/15"
            }`}
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2 text-white/60 active:text-white active:scale-90 transition-all disabled:opacity-20 rounded-full bg-white/5 active:bg-white/15"
          >
            <Redo2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Right: enhance, export, save */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoEnhance}
            className="p-2 text-white/60 active:text-white active:scale-90 transition-all bg-white/5 active:bg-white/15 rounded-full"
          >
            <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2 text-white/60 active:text-white transition-all disabled:opacity-40 bg-white/5 active:bg-white/15 rounded-full"
          >
            <Download className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onSave(activeFilterId, filterIntensity, adjustments)}
            className="px-5 py-2 rounded-full bg-white text-black text-[10px] uppercase tracking-[0.15em] font-bold active:scale-95 active:bg-zinc-200 transition-all"
          >
            Save
          </button>
        </div>
      </div>

      {/* ─── Image Preview ────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center px-3 py-1 sm:px-4 sm:py-2 min-h-0"
        style={{ touchAction: "none" }}
      >
        <div className="relative max-w-full max-h-full overflow-hidden flex items-center justify-center rounded-lg">
          {/* Canvas-rendered WYSIWYG preview */}
          {renderedPreview && !draftState && !isComparing ? (
            <img
              src={renderedPreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : (
            /* CSS approximation during live drag */
            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{ filter: isComparing ? 'none' : previewFilter }}
            >
              <img
                src={imageSrc}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
              {!isComparing && activeFilter.css !== "none" && (
                <img
                  src={imageSrc}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{ filter: activeFilter.css, opacity: filterIntensity / 100 }}
                  draggable={false}
                />
              )}
            </div>
          )}

          {/* CSS overlay effects (only during live draft / compare) */}
          {(draftState || isComparing || !renderedPreview) && (
            <>
              {!isComparing && activeFilter.tintOverlay && (
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: activeFilter.tintOverlay }} />
              )}
              {!isComparing && activeFilter.shadowTint && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{ background: `radial-gradient(ellipse at center, rgba(255,255,255,0.97) 20%, ${activeFilter.shadowTint} 100%)` }} />
              )}
              {!isComparing && activeFilter.burnEdges && activeFilter.burnEdges > 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{ background: `radial-gradient(circle, rgba(255,255,255,1) 30%, rgba(0,0,0,${(activeFilter.burnEdges / 100) * 0.88}) 100%)` }} />
              )}
              {!isComparing && adjustments.splitToneShadow !== 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneShadow)}, 0.18)` }} />
              )}
              {!isComparing && adjustments.splitToneHighlight !== 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-screen"
                  style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneHighlight)}, 0.15)` }} />
              )}
              {!isComparing && adjustments.fade > 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-lighten"
                  style={{ backgroundColor: `rgba(50,50,50,${adjustments.fade / 100})` }} />
              )}
              {!isComparing && adjustments.vignette > 0 && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${adjustments.vignette / 100}))` }} />
              )}
              {!isComparing && adjustments.grain > 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    opacity: (adjustments.grain / 100) * 0.55,
                  }} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── Bottom Controls ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-[#080808] rounded-t-2xl border-t border-white/5 flex flex-col relative z-30 max-h-[50vh] sm:max-h-[48vh]">
        {/* Tab switcher */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1.5">
          <div className="flex bg-white/5 rounded-full p-1 border border-white/[0.06] relative">
            {(["presets", "adjust"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-7 sm:px-10 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] uppercase tracking-[0.15em] font-bold transition-colors duration-200 z-10 whitespace-nowrap ${
                  activeTab === tab ? "text-black" : "text-zinc-500 active:text-white"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
          {activeTab === "presets" ? (
            <FilterCarousel
              activeFilterId={activeFilterId}
              onSelectFilter={handleFilterSelect}
              previewImage={imageSrc}
              filterIntensity={filterIntensity}
              onIntensityChange={handleIntensityChange}
              adjustments={adjustments}
              onAdjustmentChange={handleAdjustmentChange}
            />
          ) : (
            <AdjustmentsPanel
              adjustments={adjustments}
              onChange={handleAdjustmentChange}
            />
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
