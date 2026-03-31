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
  Heart,
} from "lucide-react";

interface Props {
  adjustments: Adjustments;
  onChange: (adj: Adjustments, isFinal?: boolean) => void;
}

const GROUPS = [
  {
    id: "tone",
    label: "Tone",
    tools: [
      { key: "exposure", label: "Exposure", icon: Sun, min: -100, max: 100 },
      {
        key: "brightness",
        label: "Brightness",
        icon: CircleDashed,
        min: -100,
        max: 100,
      },
      {
        key: "contrast",
        label: "Contrast",
        icon: Contrast,
        min: -100,
        max: 100,
      },
      {
        key: "highlights",
        label: "Highlights",
        icon: ArrowUpCircle,
        min: -100,
        max: 100,
      },
      {
        key: "shadows",
        label: "Shadows",
        icon: ArrowDownCircle,
        min: -100,
        max: 100,
      },
    ],
  },
  {
    id: "detail",
    label: "Detail & Optics",
    tools: [
      { key: "sharpness", label: "Sharpen", icon: Diamond, min: 0, max: 100 },
      { key: "detail", label: "Detail", icon: ScanSearch, min: 0, max: 100 },
      {
        key: "microContrast",
        label: "Micro Cont.",
        icon: Box,
        min: 0,
        max: 100,
      },
      { key: "clarity", label: "Clarity", icon: Eclipse, min: -100, max: 100 },
      { key: "dehaze", label: "Dehaze", icon: Wind, min: -100, max: 100 },
      {
        key: "highlightRolloff",
        label: "Rolloff",
        icon: ChevronDown,
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: "color",
    label: "Color",
    tools: [
      {
        key: "saturation",
        label: "Saturation",
        icon: Droplet,
        min: -100,
        max: 100,
      },
      { key: "vibrance", label: "Vibrance", icon: Zap, min: -100, max: 100 },
      {
        key: "warmth",
        label: "Warmth",
        icon: Thermometer,
        min: -100,
        max: 100,
      },
      { key: "tint", label: "Tint", icon: Pipette, min: -100, max: 100 },
      { key: "hue", label: "Hue", icon: Palette, min: -180, max: 180 },
      {
        key: "splitToneShadow",
        label: "Shadow Hue",
        icon: Moon,
        min: -180,
        max: 180,
      },
      {
        key: "splitToneHighlight",
        label: "Hi-light Hue",
        icon: Sunrise,
        min: -180,
        max: 180,
      },
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
      {
        key: "chromaticAberration",
        label: "Aberration",
        icon: Aperture,
        min: 0,
        max: 100,
      },
    ],
  },
  {
    id: "classic",
    label: "Classic",
    tools: [
      { key: "sepia", label: "Sepia", icon: ImageIcon, min: 0, max: 100 },
      {
        key: "grayscale",
        label: "Grayscale",
        icon: PaintBucket,
        min: 0,
        max: 100,
      },
      {
        key: "invert",
        label: "Invert",
        icon: FlipHorizontal,
        min: 0,
        max: 100,
      },
      { key: "blur", label: "Blur", icon: CloudFog, min: 0, max: 100 },
    ],
  },
  {
    id: "creative",
    label: "Creative",
    tools: [
      { key: "dispersion", label: "Dispersion", icon: Star, min: 0, max: 100 },
      {
        key: "posterize",
        label: "Posterize",
        icon: LayoutGrid,
        min: 0,
        max: 100,
      },
      { key: "pixelate", label: "Pixelate", icon: Hash, min: 0, max: 100 },
      {
        key: "scanLines",
        label: "Scan Lines",
        icon: ScanLine,
        min: 0,
        max: 100,
      },
    ],
  },
];

export default function AdjustmentsPanel({ adjustments, onChange }: Props) {
  const [activeKey, setActiveKey] = useState<keyof Adjustments>("exposure");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const allTools = GROUPS.flatMap((g) => g.tools);
  const activeTool = (allTools as any).find((t: any) => t.key === activeKey) ?? allTools[0];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...adjustments, [activeKey]: parseInt(e.target.value) }, false);
  };

  const handleSliderCommit = (e: React.PointerEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    onChange({ ...adjustments, [activeKey]: value }, true);
  };

  return (
    <div className="w-full h-full bg-[#030303] border-t border-white/5 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <div className="flex-shrink-0 flex justify-between items-center px-8 py-4 md:py-5 lg:py-6">
        <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-semibold">
          Adjust
        </span>
        <button
          onClick={() => onChange(DEFAULT_ADJUSTMENTS, true)}
          className="flex items-center space-x-1.5 text-zinc-500 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={2} />
          <span className="text-[9px] uppercase tracking-[0.2em] font-semibold">
            Reset All
          </span>
        </button>
      </div>

      {/* Active Slider Area */}
      <div className="flex-shrink-0 flex flex-col justify-center px-8 py-4 md:py-5 lg:py-6">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <span className="text-xs md:text-sm text-white uppercase tracking-wider font-medium">
            {activeTool.label}
          </span>
          <span className="text-xs md:text-sm text-zinc-400 font-mono">
            {adjustments[activeKey]}
          </span>
        </div>
        <div className="relative w-full h-8 md:h-10 flex items-center">
          <input
            type="range"
            min={activeTool.min}
            max={activeTool.max}
            value={adjustments[activeKey]}
            onChange={handleSliderChange}
            onPointerUp={handleSliderCommit}
            onKeyUp={(e) => {
              if (
                ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
                  e.key,
                )
              ) {
                handleSliderCommit(e);
              }
            }}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
            style={{ touchAction: "pan-y" }}
          />
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden relative">
            <div
              className="absolute h-full bg-white rounded-full"
              style={{
                left: activeTool.min < 0 ? "50%" : "0%",
                width:
                  activeTool.min < 0
                    ? `${Math.abs(adjustments[activeKey] / (activeTool.max - activeTool.min)) * 100}%`
                    : `${(adjustments[activeKey] / activeTool.max) * 100}%`,
                transform:
                  activeTool.min < 0 && adjustments[activeKey] < 0
                    ? "translateX(-100%)"
                    : "none",
              }}
            />
          </div>
          <div
            className="absolute w-4 h-4 bg-white rounded-full shadow-lg pointer-events-none"
            style={{
              left: `${((adjustments[activeKey] - activeTool.min) / (activeTool.max - activeTool.min)) * 100}%`,
              transform: "translateX(-50%)",
            }}
          />
          {activeTool.min < 0 && (
            <div className="absolute left-1/2 w-0.5 h-3 bg-zinc-600 -translate-x-1/2 rounded-full" />
          )}
        </div>
      </div>

      {/* Tools Groups (collapsible) */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-y-contain pb-4 md:pb-6 pt-2 md:pt-4">
        <div className="space-y-3 px-4">
          {GROUPS.map((group) => {
            const isCollapsed = !!collapsed[group.id];
            return (
              <div key={group.id} className="">
                <div className="flex items-center justify-between mb-2 px-2">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() =>
                        setCollapsed((s) => ({
                          ...s,
                          [group.id]: !isCollapsed,
                        }))
                      }
                      className="text-[10px] uppercase tracking-[0.12em] font-semibold text-zinc-400 bg-transparent px-2 py-1 rounded-md"
                    >
                      {group.label}
                    </button>
                    <button
                      onClick={() => {
                        // reset group values
                        const next = { ...adjustments } as any;
                        group.tools.forEach((t) => {
                          next[t.key] =
                            DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments];
                        });
                        onChange(next, true);
                      }}
                      className="text-[9px] text-zinc-500 hover:text-white bg-white/5 hover:bg-white/8 px-3 py-1 rounded-full"
                    >
                      Reset Group
                    </button>
                  </div>
                  <div className="text-[9px] text-zinc-500">
                    {group.tools.length} tools
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="flex overflow-x-auto no-scrollbar scroll-x-contain space-x-3 px-2 pb-1">
                    {group.tools.map((tool) => {
                      const Icon = tool.icon;
                      const isActive = activeKey === tool.key;
                      const isChanged =
                        adjustments[tool.key as keyof Adjustments] !==
                        DEFAULT_ADJUSTMENTS[tool.key as keyof Adjustments];
                      return (
                        <button
                          key={tool.key}
                          onClick={() =>
                            setActiveKey(tool.key as keyof Adjustments)
                          }
                          className={`relative flex flex-col items-center justify-center min-w-[66px] sm:min-w-[76px] md:min-w-[92px] lg:min-w-[120px] xl:min-w-[140px] h-[72px] sm:h-[76px] md:h-[84px] lg:h-[104px] xl:h-[120px] rounded-2xl transition-all duration-300 snap-center ${
                            isActive
                              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105"
                              : "bg-white/5 text-zinc-500 active:bg-white/15 active:scale-95"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 mb-1 ${isActive ? "text-black" : isChanged ? "text-white" : "text-zinc-500"}`}
                            strokeWidth={1.5}
                          />
                          <span
                            className={`text-[9px] text-center uppercase tracking-[0.08em] font-bold ${isActive ? "text-black" : "text-zinc-500"}`}
                          >
                            {tool.label}
                          </span>
                          {isChanged && !isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-2 shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
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
