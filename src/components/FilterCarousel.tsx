import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FILTERS, FilterCategory } from '../lib/filters';
import { Adjustments } from '../types';
import { Sparkles, Focus, Layers, Box, ChevronDown, Heart, Eclipse, Disc, Zap, CircleDashed, Aperture, Flame } from 'lucide-react';

interface FilterCarouselProps {
  activeFilterId: string;
  onSelectFilter: (id: string) => void;
  previewImage?: string;
  filterIntensity: number;
  onIntensityChange: (intensity: number, isFinal?: boolean) => void;
  adjustments: Adjustments;
  onAdjustmentChange: (adj: Adjustments, isFinal?: boolean) => void;
}

const CATEGORIES: FilterCategory[] = ['Film', 'Leica', 'Hasselblad'];

// Quick-edit parameters that appear below intensity when a filter is selected
const QUICK_PARAMS: { key: keyof Adjustments; label: string; icon: React.ElementType; min: number; max: number }[] = [
  { key: 'microContrast', label: '3D Pop', icon: Box, min: 0, max: 100 },
  { key: 'highlightRolloff', label: 'Rolloff', icon: ChevronDown, min: 0, max: 100 },
  { key: 'grain', label: 'Grain', icon: Sparkles, min: 0, max: 100 },
  { key: 'vignette', label: 'Vignette', icon: Focus, min: 0, max: 100 },
  { key: 'fade', label: 'Fade', icon: Layers, min: 0, max: 100 },
  { key: 'halation', label: 'Halation', icon: Eclipse, min: 0, max: 100 },
  { key: 'softFocus', label: 'Soft', icon: Disc, min: 0, max: 100 },
  { key: 'portraitGlow', label: 'Portrait', icon: Heart, min: 0, max: 100 },
  { key: 'lightLeak', label: 'Leak', icon: Zap, min: 0, max: 100 },
  { key: 'filmBurn', label: 'Burn', icon: Flame, min: 0, max: 100 },
  { key: 'dust', label: 'Dust', icon: CircleDashed, min: 0, max: 100 },
  { key: 'chromaticAberration', label: 'CA', icon: Aperture, min: 0, max: 100 },
];

function MiniSlider({ label, icon: Icon, value, min, max, onChange, onCommit }: {
  label: string;
  icon: React.ElementType;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onCommit: () => void;
}) {
  return (
    <div className="flex items-center space-x-2.5 min-w-[180px] snap-start">
      <Icon className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">{label}</span>
          <span className="text-[8px] text-zinc-600 font-mono">{value}</span>
        </div>
        <div className="relative h-5 flex items-center">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            onPointerUp={onCommit}
            onKeyUp={(e) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) onCommit(); }}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-full h-[3px] bg-zinc-800 rounded-full overflow-hidden relative">
            <div className="absolute h-full bg-zinc-400 rounded-full" style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
          </div>
          <div className="absolute w-2.5 h-2.5 bg-white rounded-full shadow-md pointer-events-none" style={{ left: `${((value - min) / (max - min)) * 100}%`, transform: 'translateX(-50%)' }} />
        </div>
      </div>
    </div>
  );
}

export default function FilterCarousel({ activeFilterId, onSelectFilter, previewImage, filterIntensity, onIntensityChange, adjustments, onAdjustmentChange }: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Film');

  const filteredFilters = useMemo(() => {
    return FILTERS.filter(f => f.category === activeCategory);
  }, [activeCategory]);

  const activeFilter = FILTERS.find(f => f.id === activeFilterId);

  // Only show quick params that are non-zero (set by filter) or have been modified by user
  const visibleParams = QUICK_PARAMS.filter(p => {
    const filterDefault = activeFilter ? (activeFilter as Record<string, unknown>)[p.key] : undefined;
    return (filterDefault !== undefined && filterDefault !== 0) || adjustments[p.key] > 0;
  });

  return (
    <div className="w-full flex flex-col bg-[#030303] border-t border-white/5 h-full">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto no-scrollbar px-6 py-3 space-x-3 border-b border-white/5 relative">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`relative px-5 py-2 rounded-full text-[9px] uppercase tracking-[0.2em] font-semibold whitespace-nowrap transition-all duration-300 z-10 ${
              activeCategory === category
                ? 'text-black'
                : 'text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
          >
            {activeCategory === category && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {category}
          </button>
        ))}
      </div>

      {/* Intensity + Quick-Edit Sliders */}
      {activeFilterId !== 'standard' && (
        <div className="border-b border-white/5">
          {/* Intensity */}
          <div className="px-6 pt-3 pb-1 flex items-center space-x-4">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium w-16">Intensity</span>
            <div className="relative flex-1 h-6 flex items-center">
              <input
                type="range" min="0" max="100" value={filterIntensity}
                onChange={(e) => onIntensityChange(parseInt(e.target.value), false)}
                onPointerUp={() => onIntensityChange(filterIntensity, true)}
                onKeyUp={(e) => { if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) onIntensityChange(filterIntensity, true); }}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
                <div className="absolute h-full bg-white rounded-full" style={{ width: `${filterIntensity}%` }} />
              </div>
              <div className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-lg pointer-events-none" style={{ left: `${filterIntensity}%`, transform: 'translateX(-50%)' }} />
            </div>
            <span className="text-[10px] text-zinc-400 font-mono w-6 text-right">{filterIntensity}</span>
          </div>

          {/* Quick-Edit Parameter Sliders */}
          {visibleParams.length > 0 && (
            <div className="flex overflow-x-auto no-scrollbar px-6 pb-3 pt-1 space-x-5 snap-x">
              {visibleParams.map(param => (
                <MiniSlider
                  key={param.key}
                  label={param.label}
                  icon={param.icon}
                  value={adjustments[param.key]}
                  min={param.min}
                  max={param.max}
                  onChange={(v) => onAdjustmentChange({ ...adjustments, [param.key]: v }, false)}
                  onCommit={() => onAdjustmentChange(adjustments, true)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter List */}
      <div className="flex-1 overflow-x-auto py-4 px-6 no-scrollbar flex items-center">
        <motion.div layout className="flex space-x-5 min-w-max">
          {filteredFilters.map((filter) => {
            const isActive = filter.id === activeFilterId;
            return (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={filter.id}
                onClick={() => onSelectFilter(filter.id)}
                className={`flex flex-col items-center space-y-2.5 transition-all duration-300 ${
                  isActive ? 'scale-105' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-18 h-24 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${
                    isActive ? 'ring-2 ring-white ring-offset-3 ring-offset-[#030303] shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'shadow-lg'
                  }`}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={filter.name}
                      className="w-full h-full object-cover"
                      style={{ filter: filter.css }}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-600"
                      style={{ filter: filter.css }}
                    />
                  )}
                </div>
                <span className={`text-[8px] uppercase tracking-[0.15em] font-bold ${isActive ? 'text-white' : 'text-zinc-500'}`}>
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
