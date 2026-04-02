import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Download, ChevronLeft, Undo2, Redo2, Eye, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FILTERS } from "../lib/filters";
import FilterCarousel from "./FilterCarousel";
import AdjustmentsPanel from "./AdjustmentsPanel";
import { Adjustments } from "../types";
import { getAdjustmentCss, hueToRgb } from "../lib/utils";
import { renderToCanvas, analyzeImage } from "../lib/render";

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

const clampAdj = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

export default function PhotoEditor({
  imageSrc, initialFilterId, initialFilterIntensity, initialAdjustments, onClose, onSave,
}: PhotoEditorProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "adjust">("presets");
  const [isExporting, setIsExporting]         = useState(false);
  const [isRendering, setIsRendering]         = useState(false);
  const [isComparing, setIsComparing]         = useState(false);
  const [isEnhancing, setIsEnhancing]         = useState(false);
  const [enhanceSummary, setEnhanceSummary]   = useState<string[] | null>(null);

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

  // ── Render to preview whenever ANY state changes (live preview) ────────────
  const nextRenderRef = useRef<EditorState | null>(null);
  const isRenderingRef = useRef(false);

  const requestRender = useCallback((state: EditorState) => {
    if (isRenderingRef.current) {
       nextRenderRef.current = state;
       return;
    }

    const run = async (s: EditorState) => {
      isRenderingRef.current = true;
      try {
        setIsRendering(true);
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const previewPx = Math.min(
          Math.round(Math.max(window.screen.width, window.screen.height) * dpr),
          900
        );

        // Render to offscreen canvas to prevent screen tearing while chunking
         const off = document.createElement('canvas');
         const filter = FILTERS.find(f => f.id === s.filterId) ?? FILTERS[0];
         await renderToCanvas(imageSrc, filter, s.filterIntensity, s.adjustments, off, previewPx);

         if (previewCanvasRef.current) {
            const vis = previewCanvasRef.current;
            const ctx = vis.getContext('2d');
            vis.width = off.width;
            vis.height = off.height;
            ctx?.drawImage(off, 0, 0);
         }
      } catch (e) {
         console.error('live render error', e);
      } finally {
        setIsRendering(false);
        isRenderingRef.current = false;
        if (nextRenderRef.current) {
           const next = nextRenderRef.current;
           nextRenderRef.current = null;
           run(next);
        }
      }
    };
    run(state);
  }, [imageSrc]);

  useEffect(() => {
    if (!isComparing) requestRender(currentState);
  }, [currentState, isComparing, requestRender]);

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

  // Stable refs so these never cause child re-renders from identity changes
  const currentStateRef = useRef(currentState);
  const historyRef      = useRef(history);
  const currentIndexRef = useRef(currentIndex);
  const commitStateRef  = useRef(commitState);
  currentStateRef.current  = currentState;
  historyRef.current       = history;
  currentIndexRef.current  = currentIndex;
  commitStateRef.current   = commitState;

  const handleAdjustmentChange = useCallback((newAdj: Adjustments, isFinal = false) => {
    const cs   = currentStateRef.current;
    const hist = historyRef.current;
    const idx  = currentIndexRef.current;
    if (isFinal) {
      const ns = { filterId: cs.filterId, filterIntensity: cs.filterIntensity, adjustments: newAdj };
      const prev = hist[idx];
      if (JSON.stringify(prev.adjustments) === JSON.stringify(newAdj) &&
          prev.filterId === ns.filterId && prev.filterIntensity === ns.filterIntensity) {
        setDraftState(null); return;
      }
      commitStateRef.current(ns);
    } else {
      setDraftState({ filterId: cs.filterId, filterIntensity: cs.filterIntensity, adjustments: newAdj });
    }
  }, []);

  const handleIntensityChange = useCallback((v: number, isFinal = false) => {
    const cs   = currentStateRef.current;
    const hist = historyRef.current;
    const idx  = currentIndexRef.current;
    if (isFinal) {
      const ns = { filterId: cs.filterId, filterIntensity: v, adjustments: cs.adjustments };
      const prev = hist[idx];
      if (prev.filterIntensity === v && prev.filterId === ns.filterId &&
          JSON.stringify(prev.adjustments) === JSON.stringify(ns.adjustments)) {
        setDraftState(null); return;
      }
      commitStateRef.current(ns);
    } else {
      setDraftState({ filterId: cs.filterId, filterIntensity: v, adjustments: cs.adjustments });
    }
  }, []);

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

  const handleAutoEnhance = useCallback(async () => {
    if (isEnhancing) return;
    setIsEnhancing(true);
    try {
      const result = await analyzeImage(imageSrc);
      const cs = currentStateRef.current;
      const adj = cs.adjustments;
      commitStateRef.current({
        filterId: cs.filterId,
        filterIntensity: cs.filterIntensity,
        adjustments: {
          ...adj,
          exposure:        clampAdj(adj.exposure        + result.exposure,        -100, 100),
          gamma:           clampAdj(adj.gamma           + result.gamma,           -100, 100),
          brightness:      clampAdj(adj.brightness      + result.brightness,      -100, 100),
          contrast:        clampAdj(adj.contrast        + result.contrast,        -100, 100),
          highlights:      clampAdj(adj.highlights      + result.highlights,      -100, 100),
          shadows:         clampAdj(adj.shadows         + result.shadows,         -100, 100),
          whites:          clampAdj(adj.whites          + result.whites,          -100, 100),
          blacks:          clampAdj(adj.blacks          + result.blacks,          -100, 100),
          midtones:        clampAdj(adj.midtones        + result.midtones,        -100, 100),
          clarity:         clampAdj(adj.clarity         + result.clarity,            0, 100),
          sharpness:       clampAdj(adj.sharpness       + result.sharpness,          0, 100),
          vibrance:        clampAdj(adj.vibrance        + result.vibrance,        -100, 100),
          warmth:          clampAdj(adj.warmth          + result.warmth,          -100, 100),
          tint:            clampAdj(adj.tint            + result.tint,            -100, 100),
          highlightRolloff:clampAdj(adj.highlightRolloff+ result.highlightRolloff,    0, 100),
        },
      });
      setEnhanceSummary(result.summary);
      setTimeout(() => setEnhanceSummary(null), 3000);
    } finally {
      setIsEnhancing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnhancing, imageSrc]);

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
      const exportCanvas = document.createElement('canvas');
      // Render at high resolution, capped to 3840px (4K) to avoid mobile canvas limits crashing
      await renderToCanvas(imageSrc, activeFilter, filterIntensity, adjustments, exportCanvas, 3840);
      // toBlob is async — avoids main-thread freeze that toDataURL causes on
      // large canvases, and is more memory-efficient (no base64 overhead)
      await new Promise<void>((res, rej) => {
        exportCanvas.toBlob(blob => {
          if (!blob) { rej(new Error('Export failed')); return; }
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `photo-studio-${activeFilter.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
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

  // Derived states


  return (
    <div className="relative w-full h-full bg-[#060504] flex flex-col lg:flex-row overflow-hidden">

      {/* ─── Main Content Area ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative min-w-0 min-h-0">

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
          <TopBtn onClick={handleAutoEnhance} disabled={isEnhancing} title="Keyfiyyəti artır">
            {isEnhancing
              ? <span className="w-3 h-3 rounded-full border border-[#c8bfb0]/40 border-t-[#c8bfb0] animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
            }
          </TopBtn>
          <TopBtn onClick={handleExport} disabled={isExporting} title="PNG kimi saxla">
            {isExporting
              ? <span className="w-3 h-3 rounded-full border border-[#c8bfb0]/40 border-t-[#c8bfb0] animate-spin" />
              : <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            }
          </TopBtn>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-full bg-[#e8e4df] text-[#060504] text-[9px] uppercase tracking-[0.18em] font-semibold active:scale-95 active:bg-[#d4cfc8] transition-all duration-150"
          >
            Yadda saxla
          </button>
        </div>
      </div>

      {/* ─── Enhance result toast ────────────────────────────────────── */}
      <AnimatePresence>
        {enhanceSummary && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex-shrink-0 mx-3 mb-1 px-3 py-2 rounded-xl z-30"
            style={{ background: 'rgba(200,191,176,0.07)', border: '1px solid rgba(200,191,176,0.10)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-2.5 h-2.5 text-[#c8bfb0]" strokeWidth={1.5} />
              <span className="text-[8px] uppercase tracking-[0.18em] text-[#c8bfb0] font-semibold">Tənzimləndi</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {enhanceSummary.map((s, i) => (
                <span
                  key={i}
                  className="text-[7px] text-[#5a544c] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(200,191,176,0.06)' }}
                >
                  {s}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          className="relative max-w-full max-h-full flex items-center justify-center cursor-pointer select-none"
          style={{ borderRadius: 3, overflow: 'hidden', touchAction: 'none', WebkitTouchCallout: 'none' }}
          onPointerDown={() => setIsComparing(true)}
          onPointerUp={() => setIsComparing(false)}
          onPointerCancel={() => setIsComparing(false)}
          onPointerLeave={() => setIsComparing(false)}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Live Rendered Canvas / Original Image view */}
          {isComparing ? (
             <img
               src={imageSrc}
               alt="Original"
               className="max-w-full max-h-full object-contain block"
               draggable={false}
             />
          ) : (
             <canvas
               ref={previewCanvasRef}
               className="max-w-full max-h-full object-contain block transition-opacity duration-200"
               style={{ opacity: isRendering && (!history.length || draftState) ? 0.95 : 1 }}
             />
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
                <span className="text-[8px] uppercase tracking-[0.2em] text-[#c8bfb0]/70 font-medium">Orijinal</span>
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
      
      </div>

      {/* ─── Bottom / Side panel ─────────────────────────────────────────────── */}
      <div
        className={`flex-shrink-0 flex flex-col z-30 lg:w-[350px] xl:w-[400px] border-t lg:border-t-0 lg:border-l border-[rgba(200,191,176,0.055)] h-[55vh] lg:h-full lg:max-h-none`}
        style={{
          background: 'rgba(7,5,3,0.98)',
          boxShadow: '0 0 48px rgba(0,0,0,0.55)',
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
                {tab === 'presets' ? 'filtrlər' : 'nizamla'}
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
