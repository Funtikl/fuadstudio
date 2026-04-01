import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Download, ChevronLeft, Undo2, Redo2, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  onSave: (filterId: string, filterIntensity: number, adjustments: Adjustments) => void;
}

interface EditorState {
  filterId: string;
  filterIntensity: number;
  adjustments: Adjustments;
}

export default function PhotoEditor({
  imageSrc, initialFilterId, initialFilterIntensity, initialAdjustments, onClose, onSave,
}: PhotoEditorProps) {
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "adjust">("presets");
  const [isExporting, setIsExporting]   = useState(false);
  const [isRendering, setIsRendering]   = useState(false);
  const [isComparing, setIsComparing]   = useState(false);
  const [renderedPreview, setRenderedPreview] = useState<string | null>(null);
  const renderVersionRef = useRef(0);

  // Revoke any blob URL when component unmounts to avoid memory leaks
  useEffect(() => () => {
    if (renderedPreview && renderedPreview.startsWith('blob:')) URL.revokeObjectURL(renderedPreview);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [history, setHistory]         = useState<EditorState[]>([
    { filterId: initialFilterId, filterIntensity: initialFilterIntensity, adjustments: initialAdjustments },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftState, setDraftState]     = useState<EditorState | null>(null);

  const currentState  = draftState || history[currentIndex];
  const { filterId: activeFilterId, filterIntensity, adjustments } = currentState;
  const activeFilter  = FILTERS.find(f => f.id === activeFilterId) ?? FILTERS[0];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // ── Render to preview whenever a committed state changes ──────────────────
  //
  // Preview resolution: use physical pixels of the device's longest screen
  // edge (capped at 1200px) so the preview is always crisp on Retina/OLED
  // screens without being wastefully large.
  // Preview format: PNG (lossless) — JPEG would degrade quality on every edit.
  useEffect(() => {
    if (draftState) return;
    const version = ++renderVersionRef.current;
    setIsRendering(true);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const previewPx = Math.min(
      Math.round(Math.max(window.screen.width, window.screen.height) * dpr),
      900,
    );
    const pc = document.createElement('canvas');
    renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, pc, previewPx)
      .then(() => new Promise<string>((res, rej) => {
        // toBlob is async — doesn't block the main thread like toDataURL
        pc.toBlob(blob => {
          if (!blob) { rej(new Error('preview blob failed')); return; }
          res(URL.createObjectURL(blob));
        }, 'image/png');
      }))
      .then(url => {
        if (renderVersionRef.current !== version) { URL.revokeObjectURL(url); return; }
        setRenderedPreview(prev => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return url;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (renderVersionRef.current === version) setIsRendering(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, currentIndex]);

  const commitState = useCallback((s: EditorState) => {
    setHistory(h => {
      const next = h.slice(0, currentIndex + 1);
      next.push(s);
      setCurrentIndex(next.length - 1);
      return next;
    });
    setDraftState(null);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) { setCurrentIndex(i => i - 1); setDraftState(null); }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) { setCurrentIndex(i => i + 1); setDraftState(null); }
  }, [canRedo]);

  const handleAdjustmentChange = useCallback((newAdj: Adjustments, isFinal = false) => {
    if (isFinal) {
      const ns = { filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj };
      const cs = history[currentIndex];
      if (JSON.stringify(cs.adjustments) === JSON.stringify(newAdj) && cs.filterId === ns.filterId && cs.filterIntensity === ns.filterIntensity) {
        setDraftState(null); return;
      }
      commitState(ns);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: currentState.filterIntensity, adjustments: newAdj });
    }
  }, [currentState, history, currentIndex, commitState]);

  const handleIntensityChange = useCallback((v: number, isFinal = false) => {
    if (isFinal) {
      const ns = { filterId: currentState.filterId, filterIntensity: v, adjustments: currentState.adjustments };
      const cs = history[currentIndex];
      if (cs.filterIntensity === v && cs.filterId === ns.filterId && JSON.stringify(cs.adjustments) === JSON.stringify(ns.adjustments)) {
        setDraftState(null); return;
      }
      commitState(ns);
    } else {
      setDraftState({ filterId: currentState.filterId, filterIntensity: v, adjustments: currentState.adjustments });
    }
  }, [currentState, history, currentIndex, commitState]);

  const handleFilterSelect = useCallback((filterId: string) => {
    if (filterId === currentState.filterId) return;
    const sf = FILTERS.find(f => f.id === filterId);
    commitState({
      filterId,
      filterIntensity: filterId === 'standard' ? 0 : 100,
      adjustments: {
        ...currentState.adjustments,
        grain:               sf?.grain               ?? 0,
        vignette:            sf?.vignette            ?? 0,
        lightLeak:           sf?.lightLeak           ?? 0,
        dust:                sf?.dust                ?? 0,
        halation:            sf?.halation            ?? 0,
        fade:                sf?.fade                ?? 0,
        bloom:               sf?.bloom               ?? 0,
        chromaticAberration: sf?.chromaticAberration ?? 0,
        softFocus:           sf?.softFocus           ?? 0,
        filmBurn:            sf?.filmBurn            ?? 0,
        scanLines:           sf?.scanLines           ?? 0,
        microContrast:       sf?.microContrast       ?? 0,
        highlightRolloff:    sf?.highlightRolloff    ?? 0,
        portraitGlow:        sf?.portraitGlow        ?? 0,
        splitToneShadow:     sf?.splitToneShadowHue  ?? 0,
        splitToneHighlight:  sf?.splitToneHighlightHue ?? 0,
      },
    });
  }, [currentState, commitState]);

  const handleAutoEnhance = useCallback(() => {
    commitState({
      filterId: currentState.filterId, filterIntensity: currentState.filterIntensity,
      adjustments: {
        ...adjustments,
        vibrance:   Math.min(100, adjustments.vibrance   + 25),
        shadows:    Math.min(100, adjustments.shadows    + 18),
        highlights: Math.max(-100, adjustments.highlights - 10),
        clarity:    Math.min(100, adjustments.clarity    + 12),
        sharpness:  Math.min(100, adjustments.sharpness  + 20),
        vignette:   Math.max(adjustments.vignette, 12),
        warmth:     Math.min(100, adjustments.warmth     + 5),
      },
    });
  }, [currentState, adjustments, commitState]);

  const previewFilter = useMemo(() => {
    if (isComparing) return "none";
    let f = getAdjustmentCss(adjustments);
    if (adjustments.chromaticAberration > 0) {
      const o = adjustments.chromaticAberration * 0.18;
      const a = Math.min((adjustments.chromaticAberration / 100) * 0.55, 0.5);
      f += ` drop-shadow(${o}px 0 0 rgba(255,20,20,${a})) drop-shadow(${-o}px 0 0 rgba(20,20,255,${a}))`;
    }
    return f;
  }, [isComparing, adjustments]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const canvas = canvasRef.current!;
      // Render at full native resolution — no maxDimension cap
      await renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, canvas);
      // toBlob is async — avoids main-thread freeze that toDataURL causes on
      // large canvases, and is more memory-efficient (no base64 overhead)
      await new Promise<void>((res, rej) => {
        canvas.toBlob(blob => {
          if (!blob) { rej(new Error('Export failed')); return; }
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `fuads-studio-${activeFilter.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Revoke after the browser has had time to start the download
          setTimeout(() => URL.revokeObjectURL(url), 2000);
          res();
        }, 'image/png');
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }, [imageSrc, activeFilter, filterIntensity, adjustments]);

  const handleSave = useCallback(() => {
    onSave(activeFilterId, filterIntensity, adjustments);
  }, [onSave, activeFilterId, filterIntensity, adjustments]);

  // Show draft CSS preview OR committed rendered preview
  const showRendered = !!renderedPreview && !draftState && !isComparing;
  const showDraftOverlays = (!!draftState || !renderedPreview) && !isComparing;

  return (
    <div className="relative w-full h-full bg-[#060504] flex flex-col overflow-hidden">

      {/* ─── Render progress bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {isRendering && (
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
            className="absolute top-0 left-0 right-0 h-[1px] z-50 origin-left pointer-events-none"
            style={{ background: 'linear-gradient(90deg, rgba(200,191,176,0.3), rgba(200,191,176,0.8), rgba(200,191,176,0.3))' }}
          />
        )}
      </AnimatePresence>

      {/* ─── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-between items-center px-3 pt-3 pb-2 z-20 relative">

        {/* Left: Back */}
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[#5a544c] active:text-[#c8bfb0] transition-colors active:scale-95 transform duration-100 px-1 py-1"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Centre: undo / compare / redo */}
        <div className="flex items-center gap-1">
          <TopBtn onClick={undo} disabled={!canUndo}>
            <Undo2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </TopBtn>
          <button
            onPointerDown={() => setIsComparing(true)}
            onPointerUp={() => setIsComparing(false)}
            onPointerLeave={() => setIsComparing(false)}
            onContextMenu={e => e.preventDefault()}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 select-none ${
              isComparing ? 'bg-[#e8e4df] text-[#060504]' : 'text-[#5a544c] bg-white/[0.05]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <TopBtn onClick={redo} disabled={!canRedo}>
            <Redo2 className="w-3.5 h-3.5" strokeWidth={1.5} />
          </TopBtn>
        </div>

        {/* Right: enhance / export / save */}
        <div className="flex items-center gap-1.5">
          <TopBtn onClick={handleAutoEnhance} title="Auto Enhance">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          </TopBtn>
          <TopBtn onClick={handleExport} disabled={isExporting} title="Export PNG">
            {isExporting
              ? <span className="w-3 h-3 rounded-full border border-[#c8bfb0]/40 border-t-[#c8bfb0] animate-spin" />
              : <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            }
          </TopBtn>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-full bg-[#e8e4df] text-[#060504] text-[9px] uppercase tracking-[0.18em] font-semibold active:scale-95 active:bg-[#d4cfc8] transition-all duration-150"
          >
            Save
          </button>
        </div>
      </div>

      {/* ─── Image area ───────────────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0"
        style={{ touchAction: "none", padding: '6px 12px 4px' }}
      >
        {/* Background texture */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: 0.018,
          }}
        />

        {/* Photo frame */}
        <div
          className="relative max-w-full max-h-full"
          style={{ borderRadius: 3, overflow: 'hidden' }}
        >
          {/* Rendered / CSS preview */}
          {showRendered ? (
            <motion.img
              key="rendered"
              src={renderedPreview!}
              alt="Preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="max-w-full max-h-full object-contain block"
              draggable={false}
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <div
              className="relative flex items-center justify-center"
              style={{ filter: isComparing ? 'none' : previewFilter }}
            >
              <img
                src={imageSrc}
                alt="Preview"
                className="max-w-full max-h-full object-contain block"
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

          {/* CSS overlay effects during draft (fast live preview) */}
          {showDraftOverlays && (
            <>
              {activeFilter.tintOverlay && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: activeFilter.tintOverlay }} />
              )}
              {activeFilter.shadowTint && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{ background: `radial-gradient(ellipse at center, rgba(255,255,255,0.97) 20%, ${activeFilter.shadowTint} 100%)` }} />
              )}
              {adjustments.fade > 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-lighten"
                  style={{ backgroundColor: `rgba(50,50,50,${adjustments.fade / 100})` }} />
              )}
              {adjustments.vignette > 0 && (
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle, transparent 35%, rgba(0,0,0,${adjustments.vignette / 100 * 0.9}))` }} />
              )}
              {adjustments.grain > 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    opacity: (adjustments.grain / 100) * 0.5,
                  }} />
              )}
              {adjustments.splitToneShadow !== 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-multiply"
                  style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneShadow)}, 0.18)` }} />
              )}
              {adjustments.splitToneHighlight !== 0 && (
                <div className="absolute inset-0 pointer-events-none mix-blend-screen"
                  style={{ backgroundColor: `rgba(${hueToRgb(adjustments.splitToneHighlight)}, 0.14)` }} />
              )}
            </>
          )}

          {/* "Original" compare label */}
          <AnimatePresence>
            {isComparing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full pointer-events-none"
                style={{ background: 'rgba(6,5,4,0.7)', backdropFilter: 'blur(8px)' }}
              >
                <span className="text-[8px] uppercase tracking-[0.2em] text-[#c8bfb0]/70 font-medium">Original</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rendering shimmer overlay */}
          <AnimatePresence>
            {isRendering && !draftState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'rgba(6,5,4,0.12)' }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Bottom panel ─────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 flex flex-col z-30"
        style={{
          background: 'rgba(7,5,3,0.98)',
          borderTop: '1px solid rgba(200,191,176,0.055)',
          boxShadow: '0 -24px 48px rgba(0,0,0,0.55)',
          maxHeight: activeTab === 'adjust' ? 'none' : '52vh',
        }}
      >
        {/* Tab switcher */}
        <div className="flex-shrink-0 flex justify-center pt-2.5 pb-1">
          <div
            className="flex rounded-full p-[3px]"
            style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(200,191,176,0.07)' }}
          >
            {(["presets", "adjust"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-[5px] rounded-full text-[9px] uppercase tracking-[0.18em] font-semibold z-10 transition-colors duration-200 ${
                  activeTab === tab ? "text-[#060504]" : "text-[#5a544c] active:text-[#c8bfb0]"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ background: '#e8e4df' }}
                    transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Panel content */}
        <div className={activeTab === 'adjust' ? '' : 'flex-1 overflow-y-auto no-scrollbar min-h-0'}>
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
            <AdjustmentsPanel adjustments={adjustments} onChange={handleAdjustmentChange} />
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ─── Shared top-bar icon button ───────────────────────────────────────────────
const TopBtn = React.memo(function TopBtn({
  onClick, disabled, children, title,
}: { onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a544c] bg-white/[0.05] active:bg-white/10 active:text-[#c8bfb0] active:scale-90 transition-all duration-150 disabled:opacity-20 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
});
