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
  // Canvas-rendered preview — exact match to what the export will look like
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

  // Re-render preview whenever a committed change happens (not during live drag)
  useEffect(() => {
    if (draftState) return; // skip during live slider drag — CSS preview is fast enough
    const version = ++renderVersionRef.current;
    const previewCanvas = document.createElement('canvas');
    renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, previewCanvas, 480)
      .then(() => {
        if (renderVersionRef.current !== version) return; // superseded by newer commit
        setRenderedPreview(previewCanvas.toDataURL('image/jpeg', 0.92));
      })
      .catch(() => {}); // silently fall back to CSS preview
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, currentIndex]); // only on commits, not drafts

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

  const handleAdjustmentChange = (
    newAdj: Adjustments,
    isFinal: boolean = false,
  ) => {
    if (isFinal) {
      const newState = {
        filterId: currentState.filterId,
        filterIntensity: currentState.filterIntensity,
        adjustments: newAdj,
      };
      const committedState = history[currentIndex];
      if (
        JSON.stringify(committedState.adjustments) === JSON.stringify(newAdj) &&
        committedState.filterId === newState.filterId &&
        committedState.filterIntensity === newState.filterIntensity
      ) {
        setDraftState(null);
        return;
      }
      commitState(newState);
    } else {
      setDraftState({
        filterId: currentState.filterId,
        filterIntensity: currentState.filterIntensity,
        adjustments: newAdj,
      });
    }
  };

  const handleIntensityChange = (
    newIntensity: number,
    isFinal: boolean = false,
  ) => {
    if (isFinal) {
      const newState = {
        filterId: currentState.filterId,
        filterIntensity: newIntensity,
        adjustments: currentState.adjustments,
      };
      const committedState = history[currentIndex];
      if (
        committedState.filterIntensity === newIntensity &&
        committedState.filterId === newState.filterId &&
        JSON.stringify(committedState.adjustments) ===
          JSON.stringify(newState.adjustments)
      ) {
        setDraftState(null);
        return;
      }
      commitState(newState);
    } else {
      setDraftState({
        filterId: currentState.filterId,
        filterIntensity: newIntensity,
        adjustments: currentState.adjustments,
      });
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
      // Camera system signature
      microContrast: selectedFilter?.microContrast ?? 0,
      highlightRolloff: selectedFilter?.highlightRolloff ?? 0,
      portraitGlow: selectedFilter?.portraitGlow ?? 0,
      splitToneShadow: selectedFilter?.splitToneShadowHue ?? 0,
      splitToneHighlight: selectedFilter?.splitToneHighlightHue ?? 0,
    };
    commitState({
      filterId,
      filterIntensity: 100,
      adjustments: newAdjustments,
    });
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
    commitState({
      filterId: currentState.filterId,
      filterIntensity: currentState.filterIntensity,
      adjustments: enhanced,
    });
  };

  const activeFilter =
    FILTERS.find((f) => f.id === activeFilterId) || FILTERS[0];

  // Build preview filter string with CA + dispersion drop-shadows
  const previewFilter = (() => {
    if (isComparing) return "none";
    let f = getAdjustmentCss(adjustments);
    if (adjustments.chromaticAberration > 0) {
      const offset = adjustments.chromaticAberration * 0.18;
      const alpha = Math.min(
        (adjustments.chromaticAberration / 100) * 0.55,
        0.5,
      );
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

      // Render at FULL original resolution — same pipeline as preview, no quality loss
      await renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, canvas);

      // PNG = lossless, no compression artifacts, guaranteed match to preview
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
      {/* Top Bar */}
      <div className="flex-shrink-0 relative z-20 flex justify-between items-center px-6 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex-1 flex justify-start">
          <button
            onClick={onClose}
            className="p-2.5 md:p-3 lg:p-4 text-white/70 hover:text-white active:scale-90 active:bg-white/15 transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
          >
            <ChevronLeft
              className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7"
              strokeWidth={1.5}
            />
          </button>
        </div>
        <div className="flex-1 flex justify-center space-x-2 md:space-x-3">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-2.5 md:p-3 lg:p-4 text-white/70 hover:text-white active:scale-90 active:bg-white/15 transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Undo"
          >
            <Undo2
              className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              strokeWidth={1.5}
            />
          </button>
          <button
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
            onContextMenu={(e) => e.preventDefault()}
            className={`p-2.5 md:p-3 lg:p-4 transition-all active:scale-90 rounded-full backdrop-blur-xl border border-white/10 ${isComparing ? "bg-white text-black" : "text-white/70 hover:text-white bg-white/5 hover:bg-white/10 active:bg-white/15"}`}
            title="Hold to compare"
          >
            <Eye
              className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-2.5 md:p-3 lg:p-4 text-white/70 hover:text-white active:scale-90 active:bg-white/15 transition-all disabled:opacity-30 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Redo"
          >
            <Redo2
              className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              strokeWidth={1.5}
            />
          </button>
        </div>
        <div className="flex-1 flex justify-end space-x-3 items-center">
          <button
            onClick={handleAutoEnhance}
            className="p-2.5 md:p-3 lg:p-4 text-white/70 hover:text-white active:scale-90 active:bg-white/15 transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Auto Enhance"
          >
            <Sparkles
              className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2.5 md:p-3 lg:p-4 text-white/70 hover:text-white transition-all disabled:opacity-50 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
            title="Export to Device"
          >
            <Download
              className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
              strokeWidth={1.5}
            />
          </button>
          <button
            onClick={() => onSave(activeFilterId, filterIntensity, adjustments)}
            className="px-6 md:px-8 lg:px-10 py-2.5 md:py-3 lg:py-3.5 rounded-full bg-white text-black text-xs md:text-sm lg:text-base uppercase tracking-widest font-semibold hover:bg-zinc-200 active:scale-95 active:bg-zinc-300 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Image Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 md:p-6 lg:p-8 xl:p-10 bg-[#030303] min-h-0" style={{ touchAction: "none" }}>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />
        <div className="relative max-w-full max-h-full rounded-sm overflow-hidden shadow-2xl flex items-center justify-center ring-1 ring-white/5">
          {/* ── WYSIWYG canvas preview (shown after every committed change) ──── */}
          {renderedPreview && !draftState && !isComparing ? (
            <img
              src={renderedPreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
              draggable={false}
            />
          ) : (
          /* ── CSS approximation (fast, used during live slider drag) ────── */
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
                alt="Preview Filtered"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ filter: activeFilter.css, opacity: filterIntensity / 100 }}
                draggable={false}
              />
            )}
          </div>
          )}

          {/* === CSS OVERLAY EFFECTS (only shown during live draft / compare) === */}
          {(draftState || isComparing || !renderedPreview) && (
          <>

          {/* Film tint overlay */}
          {!isComparing && activeFilter.tintOverlay && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: activeFilter.tintOverlay }}
            />
          )}

          {/* Shadow tint */}
          {!isComparing && activeFilter.shadowTint && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,0.97) 20%, ${activeFilter.shadowTint} 100%)`,
              }}
            />
          )}

          {/* Burn edges */}
          {!isComparing &&
            activeFilter.burnEdges &&
            activeFilter.burnEdges > 0 && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-multiply"
                style={{
                  background: `radial-gradient(circle, rgba(255,255,255,1) 30%, rgba(0,0,0,${(activeFilter.burnEdges / 100) * 0.88}) 100%)`,
                }}
              />
            )}

          {/* Split Tone Shadow — multiply tints dark regions */}
          {!isComparing && adjustments.splitToneShadow !== 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply"
              style={{
                backgroundColor: `rgba(${hueToRgb(adjustments.splitToneShadow)}, 0.18)`,
              }}
            />
          )}

          {/* Split Tone Highlight — screen tints bright regions */}
          {!isComparing && adjustments.splitToneHighlight !== 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                backgroundColor: `rgba(${hueToRgb(adjustments.splitToneHighlight)}, 0.15)`,
              }}
            />
          )}

          {/* Portrait Glow — warm skin-tone enhancing glow */}
          {!isComparing && adjustments.portraitGlow > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                backdropFilter: `blur(${(adjustments.portraitGlow / 100) * 18}px) brightness(1.2) saturate(1.3)`,
                backgroundColor: `rgba(255, 210, 155, ${(adjustments.portraitGlow / 100) * 0.1})`,
                opacity: (adjustments.portraitGlow / 100) * 0.32,
              }}
            />
          )}

          {/* Soft Focus — dreamy screen-blended glow */}
          {!isComparing && adjustments.softFocus > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                backdropFilter: `blur(${(adjustments.softFocus / 100) * 14}px) brightness(1.12)`,
                opacity: (adjustments.softFocus / 100) * 0.48,
                background: "rgba(255,255,255,0.04)",
              }}
            />
          )}

          {/* Fade */}
          {!isComparing && adjustments.fade > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-lighten"
              style={{
                backgroundColor: `rgba(50,50,50,${adjustments.fade / 100})`,
              }}
            />
          )}

          {/* Vignette */}
          {!isComparing && adjustments.vignette > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${adjustments.vignette / 100}))`,
              }}
            />
          )}

          {/* Grain */}
          {!isComparing && adjustments.grain > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: (adjustments.grain / 100) * 0.6,
              }}
            />
          )}

          {/* Light Leak (top-left) */}
          {!isComparing && adjustments.lightLeak > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 0% 0%, rgba(255,60,0,${(adjustments.lightLeak / 100) * 0.8}) 0%, rgba(255,120,0,${(adjustments.lightLeak / 100) * 0.4}) 30%, transparent 60%), linear-gradient(90deg, rgba(255,30,0,${(adjustments.lightLeak / 100) * 0.3}) 0%, transparent 20%)`,
              }}
            />
          )}

          {/* Film Burn (bottom-right warm glow) */}
          {!isComparing && adjustments.filmBurn > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 100% 100%, rgba(255,200,50,${(adjustments.filmBurn / 100) * 0.8}) 0%, rgba(255,100,0,${(adjustments.filmBurn / 100) * 0.4}) 30%, transparent 60%), linear-gradient(0deg, rgba(255,180,30,${(adjustments.filmBurn / 100) * 0.25}) 0%, transparent 20%)`,
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
                backgroundSize: "150px 150px",
              }}
            />
          )}

          {/* Bloom */}
          {!isComparing && adjustments.bloom > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(ellipse at center, rgba(255,255,255,${(adjustments.bloom / 100) * 0.25}) 0%, transparent 70%)`,
                backdropFilter: `blur(${(adjustments.bloom / 100) * 15}px) brightness(1.2)`,
                opacity: (adjustments.bloom / 100) * 0.6,
              }}
            />
          )}

          {/* Halation */}
          {!isComparing && adjustments.halation > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-screen"
              style={{
                background: `radial-gradient(ellipse at 50% 50%, rgba(255,100,40,${(adjustments.halation / 100) * 0.3}) 0%, rgba(255,60,20,${(adjustments.halation / 100) * 0.15}) 40%, transparent 70%)`,
                opacity: (adjustments.halation / 100) * 0.7,
              }}
            />
          )}

          {/* Scan Lines */}
          {!isComparing && adjustments.scanLines > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,${(adjustments.scanLines / 100) * 0.4}) 2px, rgba(0,0,0,${(adjustments.scanLines / 100) * 0.4}) 4px)`,
                opacity: (adjustments.scanLines / 100) * 0.8,
              }}
            />
          )}

          {/* Posterize — contrast bump proxy for preview */}
          {!isComparing && adjustments.posterize > 0 && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-overlay"
              style={{
                background: `linear-gradient(135deg, rgba(0,0,0,${(adjustments.posterize / 100) * 0.15}) 0%, rgba(255,255,255,${(adjustments.posterize / 100) * 0.08}) 100%)`,
              }}
            />
          )}
          </>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-[#030303] rounded-t-[2rem] border-t border-white/5 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] flex flex-col relative z-30 max-h-[52vh] sm:max-h-[50vh] lg:max-h-[45vh]">
        <div className="flex-shrink-0 flex justify-center pt-4 pb-2 md:pt-6 md:pb-2 lg:pt-6 lg:pb-3">
          <div className="flex bg-white/5 backdrop-blur-xl rounded-full p-1 md:p-1.5 lg:p-2 border border-white/10 relative">
            {["presets", "adjust"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "presets" | "adjust")}
                className={`relative px-6 md:px-10 lg:px-14 py-2 md:py-2 lg:py-2.5 rounded-full text-[9px] md:text-xs lg:text-sm uppercase tracking-[0.15em] font-bold transition-all duration-300 z-10 whitespace-nowrap ${activeTab === tab ? "text-black" : "text-zinc-500 hover:text-white"}`}
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
