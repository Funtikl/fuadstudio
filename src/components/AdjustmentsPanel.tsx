import React, { useState } from "react";
import { Adjustments, DEFAULT_ADJUSTMENTS } from "../types";
import {
  Sun,
  Contrast,
  Droplet,
  Thermometer,
  Palette,
  Image as ImageIcon,
  CloudFog,
  Focus,
  Sparkles,
  CircleDashed,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  Pipette,
  PaintBucket,
  FlipHorizontal,
  RotateCcw,
  Diamond,
  ScanSearch,
  Eclipse,
  Wind,
  Flower,
  Layers,
  Aperture,
  Disc,
  Flame,
  LayoutGrid,
  Moon,
  Sunrise,
  Hash,
  ScanLine,
  Star,
  Box,
  ChevronDown,
  ChevronRight,
  Heart,
} from "lucide-react";

interface Props {
  adjustments: Adjustments;
  onChange: (adj: Adjustments, isFinal?: boolean) => void;
}

interface ToolDef {
  key: string;
  label: string;
  icon: React.ElementType;
  min: number;
  max: number;
}

const GROUPS: { id: string; label: string; tools: ToolDef[] }[] = [
  {
    id: "tone",
    label: "Tone",
    tools: [
      { key: "exposure", label: "Exposure", icon: Sun, min: -100, max: 100 },
      { key: "brightness", label: "Brightness", icon: CircleDashed, min: -100, max: 100 },
      { key: "contrast", label: "Contrast", icon: Contrast, min: -100, max: 100 },
      { key: "highlights", label: "Highlights", icon: ArrowUpCircle, min: -100, max: 100 },
      { key: "shadows", label: "Shadows", icon: ArrowDownCircle, min: -100, max: 100 },
    ],
  },
  {
    id: "detail",
    label: "Detail & Optics",
    tools: [
      { key: "sharpness", label: "Sharpen", icon: Diamond, min: 0, max: 100 },
      { key: "detail", label: "Detail", icon: ScanSearch, min: 0, max: 100 },
      { key: "microContrast", label: "Micro Cont.", icon: Box, min: 0, max: 100 },
      { key: "clarity", label: "Clarity", icon: Eclipse, min: -100, max: 100 },
      { key: "dehaze", label: "Dehaze", icon: Wind, min: -100, max: 100 },
      { key: "highlightRolloff", label: "Rolloff", icon: ChevronDown, min: 0, max: 100 },
    ],
  },
  {
    id: "color",
    label: "Color",
    tools: [
      { key: "saturation", label: "Saturation", icon: Droplet, min: -100, max: 100 },
      { key: "vibrance", label: "Vibrance", icon: Zap, min: -100, max: 100 },
      { key: "warmth", label: "Warmth", icon: Thermometer, min: -100, max: 100 },
      { key: "tint", label: "Tint", icon: Pipette, min: -100, max: 100 },
      { key: "hue", label: "Hue", icon: Palette, min: -180, max: 180 },
      { key: "splitToneShadow", label: "Shadow Hue", icon: Moon, min: -180, max: 180 },
      { key: "splitToneHighlight", label: "Hi-light Hue", icon: Sunrise, min: -180, max: 180 },
    ],
  },
  {
    id: "effects",
    label: "Effects",
    tools: [
      { key: "fade", label: "Fade", icon: Layers, min: 0, max: 100 },
      { key: "bloom", label: "Bloom", icon: Flower, min: 0, max: 100 },
      { key: "softFocus", label: "Soft Focus", icon: Disc, min: 0, max: 100 },
      { key: "portraitGlow", label: "Portrait", icon: Heart, min: 0, max: 100 },
      { key: "vignette", label: "Vignette", icon: Focus, min: 0, max: 100 },
    ],
  },
  {
    id: "film",
    label: "Analog Film",
    tools: [
      { key: "grain", label: "Grain", icon: Sparkles, min: 0, max: 100 },
      { key: "halation", label: "Halation", icon: Eclipse, min: 0, max: 100 },
      { key: "lightLeak", label: "Light Leak", icon: Zap, min: 0, max: 100 },
      { key: "filmBurn", label: "Film Burn", icon: Flame, min: 0, max: 100 },
      { key: "dust", label: "Dust", icon: CircleDashed, min: 0, max: 100 },
      { key: "chromaticAberration", label: "Aberration", icon: Aperture, min: 0, max: 100 },
    ],
  },
  {
    id: "classic",
    label: "Classic",
    tools: [
      { key: "sepia", label: "Sepia", icon: ImageIcon, min: 0, max: 100 },
      { key: "grayscale", label: "Grayscale", icon: PaintBucket, min: 0, max: 100 },
      { key: "invert", label: "Invert", icon: FlipHorizontal, min: 0, max: 100 },
      { key: "blur", label: "Blur", icon: CloudFog, min: 0, max: 100 },
    ],
  },
  {
    id: "creative",
    label: "Creative",
    tools: [
      { key: "dispersion", label: "Dispersion", icon: Star, min: 0, max: 100 },
      { key: "posterize", label: "Posterize", icon: LayoutGrid, min: 0, max: 100 },
      { key: "pixelate", label: "Pixelate", icon: Hash, min: 0, max: 100 },
      { key: "scanLines", label: "Scan Lines", icon: ScanLine, min: 0, max: 100 },
    ],
  },
];

const FALLBACK_TOOL: ToolDef = { key: "exposure", label: "Exposure", icon: Sun, min: -100, max: 100 };

export default function AdjustmentsPanel({ adjustments, onChange }: Props) {
  const [activeKey, setActiveKey] = useState<keyof Adjustments>("exposure");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const allTools = GROUPS.flatMap((g) => g.tools).filter(Boolean);
  const activeTool = allTools.find((t) => t && t.key === activeKey) || allTools[0] || FALLBACK_TOOL;

  const currentValue = adjustments[activeKey] ?? 0;
  const range = activeTool.max - activeTool.min;
  const pct = ((currentValue - activeTool.min) / range) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...adjustments, [activeKey]: parseInt(e.target.value) }, false);
  };

  const handleSliderCommit = (e: any) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    if (!isNaN(value)) {
      onChange({ ...adjustments, [activeKey]: value }, true);
    }
  };

  // Count total changed params
  const changedCount = allTools.filter(
    (t) => adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments]
  ).length;

  return (
    <div className="w-full h-full flex flex-col font-sans">
      {/* Header row */}
      <div className="flex-shrink-0 flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
            Adjust
          </span>
          {changedCount > 0 && (
            <span className="text-[9px] bg-white/10 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {changedCount}
            </span>
          )}
        </div>
        <button
          onClick={() => onChange(DEFAULT_ADJUSTMENTS, true)}
          className="flex items-center gap-1.5 text-zinc-500 active:text-white transition-colors bg-white/5 active:bg-white/10 px-3 py-1.5 rounded-full"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={2} />
          <span className="text-[9px] uppercase tracking-[0.15em] font-semibold">Reset</span>
        </button>
      </div>

      {/* Active slider — the main control */}
      <div className="flex-shrink-0 px-6 pb-4 pt-1">
        <div className="flex justify-between items-baseline mb-2.5">
          <span className="text-[11px] text-white/90 uppercase tracking-widest font-semibold">
            {activeTool.label}
          </span>
          <span className={`text-[13px] font-mono tabular-nums ${currentValue === 0 ? 'text-zinc-600' : 'text-white/80'}`}>
            {currentValue > 0 ? `+${currentValue}` : currentValue}
          </span>
        </div>

        {/* Slider track */}
        <div className="relative w-full h-10 flex items-center">
          <input
            type="range"
            min={activeTool.min}
            max={activeTool.max}
            value={currentValue}
            onChange={handleSliderChange}
            onPointerUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            onKeyUp={(e) => {
              if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                handleSliderCommit(e);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ touchAction: "pan-y" }}
          />

          {/* Visual track */}
          <div className="w-full h-[3px] bg-white/8 rounded-full overflow-visible relative">
            {/* Center mark for bipolar sliders */}
            {activeTool.min < 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-2.5 -top-[3.5px] bg-zinc-600 rounded-full" />
            )}

            {/* Fill bar */}
            <div
              className="absolute h-full rounded-full transition-all duration-75"
              style={{
                background: currentValue === 0 ? 'transparent' : 'white',
                left: activeTool.min < 0 ? '50%' : '0%',
                width: activeTool.min < 0
                  ? `${Math.abs(currentValue / range) * 100}%`
                  : `${pct}%`,
                transform: activeTool.min < 0 && currentValue < 0 ? 'translateX(-100%)' : 'none',
              }}
            />
          </div>

          {/* Thumb */}
          <div
            className="absolute w-5 h-5 bg-white rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.5)] pointer-events-none transition-[left] duration-75"
            style={{
              left: `${pct}%`,
              transform: "translateX(-50%)",
            }}
          />
        </div>
      </div>

      {/* Tool groups */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-y-contain pb-4">
        <div className="space-y-1 px-3">
          {GROUPS.map((group) => {
            const isCollapsed = !!collapsed[group.id];
            const groupChanged = group.tools.some(
              (t) => adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments]
            );

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => setCollapsed((s) => ({ ...s, [group.id]: !isCollapsed }))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight
                      className={`w-3 h-3 text-zinc-600 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
                      strokeWidth={2}
                    />
                    <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-zinc-400">
                      {group.label}
                    </span>
                    {groupChanged && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-600 font-mono">{group.tools.length}</span>
                </button>

                {/* Tools row */}
                {!isCollapsed && (
                  <div className="flex overflow-x-auto no-scrollbar scroll-x-contain gap-2 px-2 pb-2 pt-0.5">
                    {group.tools.map((tool) => {
                      if (!tool) return null;
                      const Icon = tool.icon;
                      const isActive = activeKey === tool.key;
                      const val = adjustments[tool.key as keyof Adjustments];
                      const def = DEFAULT_ADJUSTMENTS[tool.key as keyof Adjustments];
                      const isChanged = val !== def;

                      return (
                        <button
                          key={tool.key}
                          onClick={() => setActiveKey(tool.key as keyof Adjustments)}
                          className={`relative flex flex-col items-center justify-center flex-shrink-0 w-[62px] sm:w-[72px] h-[64px] sm:h-[72px] rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-white text-black scale-[1.02]"
                              : "bg-white/[0.04] text-zinc-500 active:bg-white/10 active:scale-95"
                          }`}
                        >
                          <Icon
                            className={`w-[18px] h-[18px] mb-1 ${
                              isActive ? "text-black" : isChanged ? "text-white/80" : "text-zinc-500"
                            }`}
                            strokeWidth={1.5}
                          />
                          <span
                            className={`text-[8px] text-center uppercase tracking-[0.06em] font-bold leading-tight ${
                              isActive ? "text-black/80" : "text-zinc-500"
                            }`}
                          >
                            {tool.label}
                          </span>
                          {/* Value badge */}
                          {isChanged && !isActive && (
                            <div className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-white/15 rounded-full">
                              <span className="text-[7px] font-mono text-white/70">
                                {val > 0 ? `+${val}` : val}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
