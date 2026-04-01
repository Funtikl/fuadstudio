import React, { useState, useMemo, useCallback, memo } from "react";
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

const CATEGORIES: FilterCategory[] = ["Film", "Leica", "Hasselblad"];

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
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-1 min-w-[76px] snap-start">
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 min-w-0">
          <Icon className="w-2.5 h-2.5 text-[#4a4440] flex-shrink-0" strokeWidth={1.5} />
          <span className="text-[8px] uppercase tracking-[0.1em] text-[#4a4440] font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[8px] text-[#5a544c] font-mono tabular-nums">{value}</span>
          {onReset && value !== 0 && (
            <button
              onClick={onReset}
              className="text-[9px] text-[#3a3530] active:text-[#c8bfb0] transition-colors leading-none"
            >↺</button>
          )}
        </div>
      </div>
      <div className="relative h-[18px] flex items-center">
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          onPointerUp={e => onCommit(parseInt((e.target as HTMLInputElement).value))}
          onKeyUp={e => {
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key))
              onCommit(parseInt((e.currentTarget as HTMLInputElement).value));
          }}
          className="absolute inset-0 w-full h-full opacity-0 z-10"
          style={{ touchAction: "pan-y" }}
        />
        <div className="w-full h-[1.5px] rounded-full overflow-hidden" style={{ background: 'rgba(200,191,176,0.08)' }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'rgba(200,191,176,0.5)' }} />
        </div>
        <div
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)', background: '#dedad4', boxShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
        />
      </div>
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function FilterCarousel({
  activeFilterId, onSelectFilter, previewImage,
  filterIntensity, onIntensityChange, adjustments, onAdjustmentChange,
}: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("Film");

  const filteredFilters = useMemo(
    () => FILTERS.filter(f => f.category === activeCategory || (activeCategory === 'Film' && f.id === 'standard')),
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

  const handleIntensityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onIntensityChange(parseInt(e.target.value), false),
    [onIntensityChange],
  );
  const handleIntensityCommit = useCallback(
    (e: React.PointerEvent<HTMLInputElement>) => onIntensityChange(parseInt((e.target as HTMLInputElement).value), true),
    [onIntensityChange],
  );

  const isStandard = activeFilterId === 'standard';
  const intensityPct = filterIntensity;

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
          {/* Intensity row */}
          <div className="flex items-center gap-3">
            <span className="text-[8px] uppercase tracking-[0.16em] text-[#4a4440] font-medium w-12 flex-shrink-0">
              Strength
            </span>
            <div className="relative flex-1 h-[18px] flex items-center">
              <input
                type="range" min="0" max="100" value={intensityPct}
                onChange={handleIntensityChange}
                onPointerUp={handleIntensityCommit}
                className="absolute inset-0 w-full h-full opacity-0 z-10"
                style={{ touchAction: "pan-y" }}
              />
              <div className="w-full h-[1.5px] rounded-full overflow-hidden" style={{ background: 'rgba(200,191,176,0.09)' }}>
                <div className="h-full rounded-full" style={{ width: `${intensityPct}%`, background: 'rgba(200,191,176,0.65)' }} />
              </div>
              <div
                className="absolute w-2.5 h-2.5 rounded-full pointer-events-none"
                style={{ left: `${intensityPct}%`, transform: 'translateX(-50%)', background: '#e8e4df', boxShadow: '0 1px 6px rgba(0,0,0,0.5)' }}
              />
            </div>
            <span className="text-[8px] text-[#4a4440] font-mono tabular-nums w-6 text-right">{intensityPct}</span>
          </div>

          {/* Quick params */}
          {visibleParams.length > 0 && (
            <div className="flex overflow-x-auto no-scrollbar scroll-x-contain gap-4 pb-0.5">
              {visibleParams.map(param => {
                const defaultVal = activeFilter
                  ? ((activeFilter as Record<string, unknown>)[param.key] as number ?? 0) : 0;
                return (
                  <MiniSlider
                    key={param.key}
                    label={param.label} icon={param.icon}
                    value={adjustments[param.key]} min={param.min} max={param.max}
                    onChange={v => onAdjustmentChange({ ...adjustments, [param.key]: v }, false)}
                    onCommit={v => onAdjustmentChange({ ...adjustments, [param.key]: v }, true)}
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
                    /* "Original" — neutral checkerboard-style placeholder */
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
