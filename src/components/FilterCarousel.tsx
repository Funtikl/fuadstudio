import React, { useState, useMemo, useCallback, memo, useRef } from "react";
import { motion } from "motion/react";
import { FILTERS, FilterCategory } from "../lib/filters";
import { Adjustments } from "../types";
import { useSlider } from "../lib/useSlider";
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

// ─── MiniSlider ───────────────────────────────────────────────────────────────
interface MiniSliderProps {
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onCommit: (v: number) => void;
  defaultValue: number;
  onReset: () => void;
}

const MiniSlider = memo(function MiniSlider({
  label, icon: Icon, value, min, max, onChange, onCommit, defaultValue, onReset,
}: MiniSliderProps) {
  const { local, pct, handleChange, handleCommit } = useSlider(value, min, max, onChange, onCommit);
  const isChanged = local !== defaultValue;

  return (
    <div className="flex flex-col gap-1 min-w-[80px] snap-start">
      {/* Label row */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Icon className="w-[10px] h-[10px] text-[#4a4440] flex-shrink-0" strokeWidth={1.5} />
          <span className="text-[7.5px] uppercase tracking-[0.10em] text-[#4a4440] font-semibold truncate">{label}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className={`text-[8px] font-mono tabular-nums ${isChanged ? 'text-[#c8bfb0]' : 'text-[#4a4440]'}`}>{local}</span>
          {isChanged && (
            <button
              onClick={onReset}
              className="text-[10px] text-[#3a3530] active:text-[#c8bfb0] transition-colors leading-none w-4 text-center"
            >↺</button>
          )}
        </div>
      </div>

      {/* Track + thumb */}
      <div className="relative h-[24px] flex items-center">
        <input
          type="range" min={min} max={max} value={local}
          onChange={handleChange}
          onPointerUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          style={{ touchAction: "pan-y" }}   // pan-y: lets parent scroll H, slider still works
        />
        <div className="w-full h-[2px] rounded-full" style={{ background: 'rgba(200,191,176,0.10)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: isChanged ? 'rgba(200,191,176,0.65)' : 'rgba(200,191,176,0.25)' }}
          />
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

// ─── Strength slider ──────────────────────────────────────────────────────────
interface StrengthSliderProps {
  value: number;
  onChange: (v: number, isFinal: boolean) => void;
}

const StrengthSlider = memo(function StrengthSlider({ value, onChange }: StrengthSliderProps) {
  // Stable shim callbacks
  const onChangeStable = useCallback((v: number) => onChange(v, false), [onChange]);
  const onCommitStable = useCallback((v: number) => onChange(v, true),  [onChange]);
  const { local, pct, handleChange, handleCommit } = useSlider(value, 0, 100, onChangeStable, onCommitStable);

  return (
    <div className="flex items-center gap-3">
      <span className="text-[8px] uppercase tracking-[0.16em] text-[#4a4440] font-semibold w-12 flex-shrink-0">
        Strength
      </span>
      <div className="relative flex-1 h-[42px] flex items-center">
        <input
          type="range" min={0} max={100} value={local}
          onChange={handleChange}
          onPointerUp={handleCommit}
          onTouchEnd={handleCommit}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          style={{ touchAction: "none" }}
        />
        <div className="w-full h-[3px] rounded-full" style={{ background: 'rgba(200,191,176,0.10)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(200,191,176,0.72)' }} />
        </div>
        <div
          className="absolute w-[22px] h-[22px] rounded-full pointer-events-none"
          style={{
            left: `${pct}%`, transform: 'translateX(-50%)',
            background: '#e8e4df', boxShadow: '0 2px 10px rgba(0,0,0,0.55)',
          }}
        />
      </div>
      <span className="text-[9px] text-[#c8bfb0] font-mono tabular-nums w-7 text-right font-medium">{local}</span>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function FilterCarousel({
  activeFilterId, onSelectFilter, previewImage,
  filterIntensity, onIntensityChange, adjustments, onAdjustmentChange,
}: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("Leica");

  // Refs so MiniSlider callbacks never need to recreate
  const adjRef           = useRef(adjustments);
  const onAdjChangeRef   = useRef(onAdjustmentChange);
  adjRef.current         = adjustments;
  onAdjChangeRef.current = onAdjustmentChange;

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

  // Stable per-key callbacks — created ONCE per QUICK_PARAMS key, never recreated
  // They always read latest adjustments via ref
  const stableCallbacks = useRef(
    Object.fromEntries(QUICK_PARAMS.map(p => [
      p.key,
      {
        onChange: (v: number) => onAdjChangeRef.current({ ...adjRef.current, [p.key]: v }, false),
        onCommit: (v: number) => onAdjChangeRef.current({ ...adjRef.current, [p.key]: v }, true),
        onReset:  (def: number) => () => onAdjChangeRef.current({ ...adjRef.current, [p.key]: def }, true),
      },
    ]))
  ).current;

  const isStandard = activeFilterId === 'standard';

  // Stable select handler
  const handleSelect = useCallback((id: string) => onSelectFilter(id), [onSelectFilter]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* ── Category tabs ────────────────────────────────────────────── */}
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

      {/* ── Intensity + quick params ──────────────────────────────────── */}
      {!isStandard && (
        <div
          className="flex-shrink-0 px-4 pb-2 space-y-2.5"
          style={{ borderBottom: '1px solid rgba(200,191,176,0.06)' }}
        >
          <StrengthSlider value={filterIntensity} onChange={onIntensityChange} />

          {visibleParams.length > 0 && (
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-1">
              {visibleParams.map(param => {
                const defaultVal = activeFilter
                  ? ((activeFilter as Record<string, unknown>)[param.key] as number ?? 0) : 0;
                const cb = stableCallbacks[param.key as string];
                return (
                  <MiniSlider
                    key={param.key}
                    label={param.label}
                    icon={param.icon}
                    value={adjustments[param.key]}
                    min={param.min}
                    max={param.max}
                    onChange={cb.onChange}
                    onCommit={cb.onCommit}
                    defaultValue={defaultVal}
                    onReset={cb.onReset(defaultVal)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Filter thumbnails ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto no-scrollbar py-3 px-4 flex items-center min-h-0">
        <motion.div layout className="flex gap-2.5 min-w-max">
          {filteredFilters.map(filter => {
            const isActive = filter.id === activeFilterId;
            const isOrig   = filter.id === 'standard';

            return (
              <motion.button
                layout
                key={filter.id}
                onClick={() => handleSelect(filter.id)}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.16 }}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform duration-120 select-none"
              >
                <div
                  className="w-[56px] h-[76px] rounded-[8px] overflow-hidden flex-shrink-0 transition-all duration-200"
                  style={{
                    boxShadow: isActive
                      ? '0 0 0 2px #e8e4df, 0 4px 18px rgba(0,0,0,0.65)'
                      : '0 2px 10px rgba(0,0,0,0.40)',
                    opacity:   isActive ? 1 : 0.40,
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {isOrig ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0c0a08 100%)' }}
                    >
                      <span className="text-[7px] uppercase tracking-[0.14em] text-[#3a3530] font-semibold text-center leading-tight px-1">
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
                      className="w-full h-full"
                      style={{
                        background: 'linear-gradient(135deg, #2a2218 0%, #0e0c0a 100%)',
                        filter: filter.css,
                      }}
                    />
                  )}
                </div>
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
