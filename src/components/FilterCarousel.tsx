import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { FILTERS, FilterCategory } from "../lib/filters";
import { Adjustments } from "../types";
import {
  Sparkles, Focus, Layers, Box, ChevronDown, Heart,
  Eclipse, Disc, Zap, CircleDashed, Aperture, Flame,
} from "lucide-react";

interface FilterCarouselProps {
  activeFilterId: string;
  onSelectFilter: (id: string) => void;
  previewImage?: string;
  filterIntensity: number;
  onIntensityChange: (intensity: number, isFinal?: boolean) => void;
  adjustments: Adjustments;
  onAdjustmentChange: (adj: Adjustments, isFinal?: boolean) => void;
}

const CATEGORIES: FilterCategory[] = ["Leica", "Film", "Hasselblad"];

const QUICK_PARAMS: {
  key: keyof Adjustments;
  label: string;
  icon: React.ElementType;
  min: number;
  max: number;
}[] = [
  { key: "microContrast",        label: "3D Pop",  icon: Box,         min: 0, max: 100 },
  { key: "highlightRolloff",     label: "Rolloff", icon: ChevronDown, min: 0, max: 100 },
  { key: "grain",                label: "Grain",   icon: Sparkles,    min: 0, max: 100 },
  { key: "vignette",             label: "Vignette",icon: Focus,       min: 0, max: 100 },
  { key: "fade",                 label: "Fade",    icon: Layers,      min: 0, max: 100 },
  { key: "halation",             label: "Halation",icon: Eclipse,     min: 0, max: 100 },
  { key: "softFocus",            label: "Soft",    icon: Disc,        min: 0, max: 100 },
  { key: "portraitGlow",         label: "Portrait",icon: Heart,       min: 0, max: 100 },
  { key: "lightLeak",            label: "Leak",    icon: Zap,         min: 0, max: 100 },
  { key: "filmBurn",             label: "Burn",    icon: Flame,       min: 0, max: 100 },
  { key: "dust",                 label: "Dust",    icon: CircleDashed,min: 0, max: 100 },
  { key: "chromaticAberration",  label: "CA",      icon: Aperture,    min: 0, max: 100 },
];

// ─── useLocalSlider: decouples visual from React prop cycle ──────────────────
// Returns [localVal, pct, handlers]. Visual updates happen before rAF batches
// the parent notification — thumb is always instant.
function useLocalSlider(
  value: number,
  min: number,
  max: number,
  onChange: (v: number) => void,
  onCommit: (v: number) => void,
) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);
  const raf      = useRef(0);

  // Sync from parent when not dragging (filter switch, undo, etc.)
  useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    dragging.current = true;
    setLocal(v);                            // Instant visual
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => onChange(v)); // Batched
  }, [onChange]);

  const handleCommit = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    dragging.current = false;
    cancelAnimationFrame(raf.current);
    const v = parseInt((e.target as HTMLInputElement).value);
    setLocal(v);
    onCommit(v);
  }, [onCommit]);

  const pct = ((local - min) / (max - min)) * 100;
  return { local, pct, handleChange, handleCommit };
}

// ─── Mini slider ──────────────────────────────────────────────────────────────
interface MiniSliderProps {
  key?: React.Key;
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  onReset?: () => void;
}

const MiniSlider = memo(function MiniSlider({
  label, icon: Icon, value, min, max, onChange, onCommit, onReset,
}: MiniSliderProps) {
  const { local, pct, handleChange, handleCommit } = useLocalSlider(value, min, max, onChange, onCommit);
  return (
    <div className="flex flex-col gap-1 min-w-[76px] snap-start">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Icon className="w-2.5 h-2.5 text-[#4a4440] flex-shrink-0" strokeWidth={1.5} />
          <span className="text-[8px] uppercase tracking-[0.1em] text-[#4a4440] font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[8px] text-[#5a544c] font-mono tabular-nums">{local}</span>
          {onReset && value !== 0 && (
            <button
              onClick={onReset}
              className="text-[9px] text-[#3a3530] active:text-[#c8bfb0] transition-colors leading-none"
            >↺</button>
          )}
        </div>
      </div>
      <div className="relative h-[22px] flex items-center">
        <input
          type="range" min={min} max={max} value={local}
          onChange={handleChange}
          onPointerUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          style={{ touchAction: "none" }}
        />
        <div className="w-full h-[2px] rounded-full overflow-visible" style={{ background: 'rgba(200,191,176,0.09)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(200,191,176,0.55)' }} />
        </div>
        <div
          className="absolute w-[14px] h-[14px] rounded-full pointer-events-none"
          style={{
            left: `${pct}%`, transform: 'translateX(-50%)',
            background: '#dedad4', boxShadow: '0 1px 6px rgba(0,0,0,0.55)',
          }}
        />
      </div>
    </div>
  );
});

// ─── Strength slider (inline, no memo needed — parent already memo-gates) ─────
interface StrengthSliderProps {
  value: number;
  onChange: (v: number, isFinal?: boolean) => void;
}

const StrengthSlider = memo(function StrengthSlider({ value, onChange }: StrengthSliderProps) {
  const { local, pct, handleChange, handleCommit } = useLocalSlider(
    value, 0, 100,
    (v) => onChange(v, false),
    (v) => onChange(v, true),
  );
  return (
    <div className="flex items-center gap-3">
      <span className="text-[8px] uppercase tracking-[0.16em] text-[#4a4440] font-medium w-12 flex-shrink-0">
        Strength
      </span>
      <div className="relative flex-1 h-[22px] flex items-center">
        <input
          type="range" min={0} max={100} value={local}
          onChange={handleChange}
          onPointerUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          style={{ touchAction: "none" }}
        />
        <div className="w-full h-[2px] rounded-full overflow-visible" style={{ background: 'rgba(200,191,176,0.09)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(200,191,176,0.70)' }} />
        </div>
        <div
          className="absolute w-[18px] h-[18px] rounded-full pointer-events-none"
          style={{
            left: `${pct}%`, transform: 'translateX(-50%)',
            background: '#e8e4df', boxShadow: '0 1px 8px rgba(0,0,0,0.55)',
          }}
        />
      </div>
      <span className="text-[8px] text-[#4a4440] font-mono tabular-nums w-6 text-right">{local}</span>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function FilterCarousel({
  activeFilterId, onSelectFilter, previewImage,
  filterIntensity, onIntensityChange, adjustments, onAdjustmentChange,
}: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("Leica");

  const filteredFilters = useMemo(
    () => FILTERS.filter(f => f.category === activeCategory || (activeCategory === 'Leica' && f.id === 'standard')),
    [activeCategory],
  );

  const activeFilter = useMemo(
    () => FILTERS.find(f => f.id === activeFilterId),
    [activeFilterId],
  );

  const visibleParams = useMemo(
    () => QUICK_PARAMS.filter(p => {
      const fd = activeFilter ? (activeFilter as Record<string, unknown>)[p.key] : undefined;
      return fd !== undefined || adjustments[p.key] !== 0;
    }),
    [activeFilter, adjustments],
  );

  // Stable callbacks for MiniSlider — avoid re-creating on each render
  const miniCallbacks = useMemo(() =>
    Object.fromEntries(QUICK_PARAMS.map(p => [
      p.key,
      {
        onChange: (v: number) => onAdjustmentChange({ ...adjustments, [p.key]: v }, false),
        onCommit: (v: number) => onAdjustmentChange({ ...adjustments, [p.key]: v }, true),
      },
    ])),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [onAdjustmentChange, adjustments],
  );

  const isStandard = activeFilterId === 'standard';

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* ── Category tabs ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-4 pt-2 pb-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`relative px-3.5 py-1.5 rounded-full text-[8px] uppercase tracking-[0.18em] font-semibold transition-all duration-200 active:scale-95 ${
              activeCategory === cat ? 'text-[#060504]' : 'text-[#4a4440] active:text-[#c8bfb0]'
            }`}
          >
            {activeCategory === cat && (
              <motion.div
                layoutId="activeCat"
                className="absolute inset-0 rounded-full -z-10"
                style={{ background: '#e8e4df' }}
                transition={{ type: "spring", bounce: 0.12, duration: 0.38 }}
              />
            )}
            {cat}
          </button>
        ))}
      </div>

      {/* ── Intensity + quick params ───────────────────────────────── */}
      {!isStandard && (
        <div
          className="flex-shrink-0 px-4 pb-2 space-y-2.5"
          style={{ borderBottom: '1px solid rgba(200,191,176,0.05)' }}
        >
          <StrengthSlider value={filterIntensity} onChange={onIntensityChange} />

          {/* Quick params */}
          {visibleParams.length > 0 && (
            <div className="flex overflow-x-auto no-scrollbar scroll-x-contain gap-4 pb-0.5">
              {visibleParams.map(param => {
                const defaultVal = activeFilter
                  ? ((activeFilter as Record<string, unknown>)[param.key] as number ?? 0) : 0;
                const cb = miniCallbacks[param.key as string];
                return (
                  <MiniSlider
                    key={param.key}
                    label={param.label} icon={param.icon}
                    value={adjustments[param.key]} min={param.min} max={param.max}
                    onChange={cb.onChange}
                    onCommit={cb.onCommit}
                    onReset={() => onAdjustmentChange({ ...adjustments, [param.key]: defaultVal }, true)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Filter thumbnails ──────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto no-scrollbar scroll-x-contain py-3 px-4 flex items-center min-h-0">
        <motion.div layout className="flex gap-2.5 min-w-max">
          {filteredFilters.map(filter => {
            const isActive = filter.id === activeFilterId;
            const isOrig   = filter.id === 'standard';

            return (
              <motion.button
                layout
                key={filter.id}
                onClick={() => onSelectFilter(filter.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-150 select-none"
              >
                {/* Thumbnail */}
                <div
                  className="w-[56px] h-[76px] rounded-[7px] overflow-hidden flex-shrink-0 transition-all duration-200"
                  style={{
                    boxShadow: isActive
                      ? '0 0 0 2px #e8e4df, 0 4px 16px rgba(0,0,0,0.6)'
                      : '0 2px 10px rgba(0,0,0,0.45)',
                    opacity:   isActive ? 1 : 0.42,
                    transform: isActive ? 'scale(1.07)' : 'scale(1)',
                  }}
                >
                  {isOrig ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0c0a08 100%)' }}
                    >
                      <span className="text-[8px] uppercase tracking-[0.16em] text-[#3a3530] font-medium text-center leading-tight px-1">
                        None
                      </span>
                    </div>
                  ) : previewImage ? (
                    <img
                      src={previewImage}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.css }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-b from-zinc-700 to-zinc-900"
                      style={{ filter: filter.css }}
                    />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[6.5px] uppercase tracking-[0.10em] font-semibold transition-colors duration-200 max-w-[60px] text-center truncate ${
                  isActive ? 'text-[#c8bfb0]' : 'text-[#2e2a26]'
                }`}>
                  {filter.name}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
