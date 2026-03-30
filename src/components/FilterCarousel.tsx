import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FILTERS, FilterCategory } from '../lib/filters';

interface FilterCarouselProps {
  activeFilterId: string;
  onSelectFilter: (id: string) => void;
  previewImage?: string;
  filterIntensity: number;
  onIntensityChange: (intensity: number, isFinal?: boolean) => void;
}

const CATEGORIES: FilterCategory[] = ['Essentials', 'Magic', 'Film', 'Cinematic', 'Vintage', 'B&W', 'Creative'];

export default function FilterCarousel({ activeFilterId, onSelectFilter, previewImage, filterIntensity, onIntensityChange }: FilterCarouselProps) {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('Essentials');

  const filteredFilters = useMemo(() => {
    return FILTERS.filter(f => f.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="w-full flex flex-col bg-[#030303] border-t border-white/5 h-full">
      {/* Category Tabs */}
      <div className="flex overflow-x-auto no-scrollbar px-6 py-4 space-x-3 border-b border-white/5 relative">
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

      {/* Intensity Slider */}
      {activeFilterId !== 'standard' && (
        <div className="px-6 py-4 flex items-center space-x-4 border-b border-white/5">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium w-16">Intensity</span>
          <div className="relative flex-1 h-8 flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              value={filterIntensity}
              onChange={(e) => onIntensityChange(parseInt(e.target.value), false)}
              onPointerUp={() => onIntensityChange(filterIntensity, true)}
              onKeyUp={(e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                  onIntensityChange(filterIntensity, true);
                }
              }}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
              <div 
                className="absolute h-full bg-white rounded-full"
                style={{
                  left: '0%',
                  width: `${filterIntensity}%`,
                }}
              />
            </div>
            <div 
              className="absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none"
              style={{
                left: `${filterIntensity}%`,
                transform: 'translateX(-50%)'
              }}
            />
          </div>
          <span className="text-[10px] text-zinc-400 font-mono w-6 text-right">{filterIntensity}</span>
        </div>
      )}

      {/* Filter List */}
      <div className="flex-1 overflow-x-auto py-6 px-6 no-scrollbar flex items-center">
        <motion.div 
          layout
          className="flex space-x-5 min-w-max"
        >
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
                className={`flex flex-col items-center space-y-3 transition-all duration-300 ${
                  isActive ? 'scale-105' : 'opacity-40 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${
                    isActive ? 'ring-2 ring-white ring-offset-4 ring-offset-[#030303] shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'shadow-lg'
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
                <span className={`text-[9px] uppercase tracking-[0.15em] font-bold ${isActive ? 'text-white' : 'text-zinc-500'}`}>
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
