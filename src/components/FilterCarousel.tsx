import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FILTERS, FilterCategory } from "../lib/filters";
import { Adjustments } from "../types";
import {
  Sparkles,
  Focus,
  Layers,
  Box,
  ChevronDown,
  Heart,
  Eclipse,
  Disc,
  Zap,
  CircleDashed,
  Aperture,
  Flame,
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
  { key: "microContrast", label: "3D Pop", icon: Box, min: 0, max: 100 },
  { key: "highlightRolloff", label: "Rolloff", icon: ChevronDown, min: 0, max: 100 },
  { key: "grain", label: "Grain", icon: Sparkles, min: 0, max: 100 },
  { key: "vignette", label: "Vignette", icon: Focus, min: 0, max: 100 },
  { key: "fade", label: "Fade", icon: Layers, min: 0, max: 100 },
  { key: "halation", label: "Halation", icon: Eclipse, min: 0, max: 100 },
  { key: "softFocus", label: "Soft", icon: Disc, min: 0, max: 100 },
  { key: "portraitGlow", label: "Portrait", icon: Heart, min: 0, max: 100 },
  { key: "lightLeak", label: "Leak", icon: Zap, min: 0, max: 100 },
  { key: "filmBurn", label: "Burn", icon: Flame, min: 0, max: 100 },
  { key: "dust", label: "Dust", icon: CircleDashed, min: 0, max: 100 },
  { key: "chromaticAberration", label: "CA", icon: Aperture, min: 0, max: 100 },
];

function MiniSlider({
  label,
  icon: Icon,
  value,
  min,
  max,
  onChange,
  onCommit,
  onReset,
}: {
  key?: React.Key;
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  // receives the committed value directly from the input event — no stale closure
  onCommit: (v: number) => void;
  onReset?: () => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center space-x-2.5 min-w-[155px] snap-start">
      <Icon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">
            {label}
          </span>
          <span className="text-[8px] text-zinc-600 font-mono">{value}</span>
        </div>
        {/* Track + thumb rendered under the transparent native input */}
        <div className="relative h-6 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            onPointerUp={(e) => onCommit(parseInt((e.target as HTMLInputElement).value))}
            onKeyUp={(e) => {
              if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
                onCommit(parseInt((e.currentTarget as HTMLInputElement).value));
            }}
            className="absolute inset-0 w-full h-full opacity-0 z-10"
            style={{ touchAction: "pan-y" }}
          />
          <div className="w-full h-[3px] bg-zinc-800 rounded-full overflow-hidden relative pointer-events-none">
            <div className="absolute h-full bg-zinc-400 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none"
            style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
          />
        </div>
      </div>
      {onReset && (
        <button
          onClick={onReset}
          className="ml-1.5 text-[9px] px-2 py-1 rounded-full bg-white/5 text-zinc-500 active:bg-white/15 active:text-white transition-colors"
        >
          ↺
        </button>
      )}
    </div>
  );
}

export default function FilterCarousel({
  activeFilterId,
  onSelectFilter,
  previewImage,
  filterIntensity,
  onIntensityChange,
  adjustments,
  onAdjustmentChange,
}: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("Film");

  const filteredFilters = useMemo(
    () => FILTERS.filter((f) => f.category === activeCategory),
    [activeCategory],
  );

  const activeFilter = FILTERS.find((f) => f.id === activeFilterId);

  const visibleParams = QUICK_PARAMS.filter((p) => {
    const filterDefault = activeFilter
      ? (activeFilter as Record<string, unknown>)[p.key]
      : undefined;
    return filterDefault !== undefined || adjustments[p.key] !== 0;
  });

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] border-t border-white/5 overflow-hidden">

      {/* Category Tabs */}
      <div className="flex-shrink-0 flex overflow-x-auto no-scrollbar scroll-x-contain px-5 py-2 space-x-2 border-b border-white/5">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`relative px-5 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition-colors duration-200 z-10 active:scale-95 ${
              activeCategory === category
                ? "text-black"
                : "text-zinc-500 bg-white/5 active:bg-white/15"
            }`}
          >
            {activeCategory === category && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-white rounded-full -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            {category}
          </button>
        ))}
      </div>

      {/* Intensity + Quick-Edit Sliders */}
      {activeFilterId !== "standard" && (
        <div className="flex-shrink-0 border-b border-white/5">
          {/* Intensity */}
          <div className="px-5 pt-3 pb-1 flex items-center space-x-3">
            <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-medium w-14 flex-shrink-0">
              Intensity
            </span>
            <div className="relative flex-1 h-7 flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                value={filterIntensity}
                onChange={(e) => onIntensityChange(parseInt(e.target.value), false)}
                onPointerUp={(e) =>
                  onIntensityChange(parseInt((e.target as HTMLInputElement).value), true)
                }
                onKeyUp={(e) => {
                  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
                    onIntensityChange(filterIntensity, true);
                }}
                className="absolute inset-0 w-full h-full opacity-0 z-10"
                style={{ touchAction: "pan-y" }}
              />
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative pointer-events-none">
                <div className="absolute h-full bg-white rounded-full" style={{ width: `${filterIntensity}%` }} />
              </div>
              <div
                className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg pointer-events-none"
                style={{ left: `${filterIntensity}%`, transform: "translateX(-50%)" }}
              />
            </div>
            <span className="text-[9px] text-zinc-400 font-mono w-7 text-right flex-shrink-0">
              {filterIntensity}
            </span>
          </div>

          {/* Quick-Edit Parameter Sliders */}
          {visibleParams.length > 0 && (
            <div className="flex overflow-x-auto no-scrollbar scroll-x-contain px-5 pb-3 pt-1 space-x-5 snap-x snap-mandatory">
              {visibleParams.map((param) => {
                const defaultVal = activeFilter
                  ? ((activeFilter as Record<string, unknown>)[param.key] as number ?? 0)
                  : 0;
                return (
                  <MiniSlider
                    key={param.key}
                    label={param.label}
                    icon={param.icon}
                    value={adjustments[param.key]}
                    min={param.min}
                    max={param.max}
                    onChange={(v) =>
                      onAdjustmentChange({ ...adjustments, [param.key]: v }, false)
                    }
                    // FIX: pass committed value directly from the input event
                    onCommit={(v) =>
                      onAdjustmentChange({ ...adjustments, [param.key]: v }, true)
                    }
                    onReset={() =>
                      onAdjustmentChange({ ...adjustments, [param.key]: defaultVal }, true)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filter List */}
      <div className="flex-1 overflow-x-auto no-scrollbar scroll-x-contain py-3 px-5 flex items-center min-h-0">
        <motion.div layout className="flex space-x-4 min-w-max">
          {filteredFilters.map((filter) => {
            const isActive = filter.id === activeFilterId;
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                key={filter.id}
                onClick={() => onSelectFilter(filter.id)}
                className={`flex flex-col items-center space-y-2 transition-all duration-200 active:scale-95 ${
                  isActive ? "scale-105" : "opacity-40 active:opacity-60"
                }`}
              >
                <div
                  className={`w-[64px] h-[88px] sm:w-[72px] sm:h-[100px] rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#030303] shadow-[0_0_16px_rgba(255,255,255,0.15)]"
                      : "shadow-lg"
                  }`}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.css }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-600"
                      style={{ filter: filter.css }}
                    />
                  )}
                </div>
                <span
                  className={`text-[8px] uppercase tracking-[0.12em] font-bold ${
                    isActive ? "text-white" : "text-zinc-600"
                  }`}
                >
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
