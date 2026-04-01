import React, { useState, useCallback, useMemo } from "react";
import { Adjustments, DEFAULT_ADJUSTMENTS } from "../types";
import {
  Sun, Contrast, Droplet, Thermometer, Palette, Image as ImageIcon,
  CloudFog, Focus, Sparkles, CircleDashed, ArrowUpCircle, ArrowDownCircle,
  Zap, Pipette, PaintBucket, FlipHorizontal, RotateCcw, Diamond,
  ScanSearch, Eclipse, Wind, Flower, Layers, Aperture, Disc, Flame,
  LayoutGrid, Moon, Sunrise, Hash, ScanLine, Star, Box, ChevronRight, Heart,
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
    id: "tone", label: "Tone",
    tools: [
      { key: "exposure",   label: "Exposure",   icon: Sun,            min: -100, max: 100 },
      { key: "brightness", label: "Brightness", icon: CircleDashed,   min: -100, max: 100 },
      { key: "contrast",   label: "Contrast",   icon: Contrast,       min: -100, max: 100 },
      { key: "highlights", label: "Highlights", icon: ArrowUpCircle,  min: -100, max: 100 },
      { key: "shadows",    label: "Shadows",    icon: ArrowDownCircle,min: -100, max: 100 },
    ],
  },
  {
    id: "detail", label: "Detail",
    tools: [
      { key: "sharpness",        label: "Sharpen",  icon: Diamond,    min: 0, max: 100 },
      { key: "detail",           label: "Detail",   icon: ScanSearch, min: 0, max: 100 },
      { key: "microContrast",    label: "Micro",    icon: Box,        min: 0, max: 100 },
      { key: "clarity",          label: "Clarity",  icon: Eclipse,    min: -100, max: 100 },
      { key: "dehaze",           label: "Dehaze",   icon: Wind,       min: -100, max: 100 },
      { key: "highlightRolloff", label: "Rolloff",  icon: Sun,        min: 0, max: 100 },
    ],
  },
  {
    id: "color", label: "Color",
    tools: [
      { key: "saturation",        label: "Saturation", icon: Droplet,    min: -100, max: 100 },
      { key: "vibrance",          label: "Vibrance",   icon: Zap,        min: -100, max: 100 },
      { key: "warmth",            label: "Warmth",     icon: Thermometer,min: -100, max: 100 },
      { key: "tint",              label: "Tint",       icon: Pipette,    min: -100, max: 100 },
      { key: "hue",               label: "Hue",        icon: Palette,    min: -180, max: 180 },
      { key: "splitToneShadow",   label: "Shd Hue",   icon: Moon,       min: -180, max: 180 },
      { key: "splitToneHighlight",label: "Hi Hue",    icon: Sunrise,    min: -180, max: 180 },
    ],
  },
  {
    id: "effects", label: "Effects",
    tools: [
      { key: "fade",        label: "Fade",       icon: Layers, min: 0, max: 100 },
      { key: "bloom",       label: "Bloom",      icon: Flower, min: 0, max: 100 },
      { key: "softFocus",   label: "Soft Focus", icon: Disc,   min: 0, max: 100 },
      { key: "portraitGlow",label: "Portrait",   icon: Heart,  min: 0, max: 100 },
      { key: "vignette",    label: "Vignette",   icon: Focus,  min: 0, max: 100 },
    ],
  },
  {
    id: "film", label: "Analog Film",
    tools: [
      { key: "grain",               label: "Grain",     icon: Sparkles,    min: 0, max: 100 },
      { key: "halation",            label: "Halation",  icon: Eclipse,     min: 0, max: 100 },
      { key: "lightLeak",           label: "Light Leak",icon: Zap,         min: 0, max: 100 },
      { key: "filmBurn",            label: "Film Burn", icon: Flame,       min: 0, max: 100 },
      { key: "dust",                label: "Dust",      icon: CircleDashed,min: 0, max: 100 },
      { key: "chromaticAberration", label: "Aberration",icon: Aperture,    min: 0, max: 100 },
    ],
  },
  {
    id: "classic", label: "Classic",
    tools: [
      { key: "sepia",     label: "Sepia",     icon: ImageIcon,      min: 0, max: 100 },
      { key: "grayscale", label: "Grayscale", icon: PaintBucket,    min: 0, max: 100 },
      { key: "invert",    label: "Invert",    icon: FlipHorizontal, min: 0, max: 100 },
      { key: "blur",      label: "Blur",      icon: CloudFog,       min: 0, max: 100 },
    ],
  },
  {
    id: "creative", label: "Creative",
    tools: [
      { key: "dispersion", label: "Dispersion", icon: Star,      min: 0, max: 100 },
      { key: "posterize",  label: "Posterize",  icon: LayoutGrid,min: 0, max: 100 },
      { key: "pixelate",   label: "Pixelate",   icon: Hash,      min: 0, max: 100 },
      { key: "scanLines",  label: "Scan Lines", icon: ScanLine,  min: 0, max: 100 },
    ],
  },
];

const FALLBACK: ToolDef = { key: "exposure", label: "Exposure", icon: Sun, min: -100, max: 100 };

export default function AdjustmentsPanel({ adjustments, onChange }: Props) {
  const [activeKey, setActiveKey]   = useState<keyof Adjustments>("exposure");
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>({});

  const allTools   = useMemo(() => GROUPS.flatMap(g => g.tools).filter(Boolean), []);
  const activeTool = useMemo(
    () => allTools.find(t => t && t.key === activeKey) || allTools[0] || FALLBACK,
    [allTools, activeKey],
  );

  const val   = adjustments[activeKey] ?? 0;
  const range = activeTool.max - activeTool.min;
  const pct   = ((val - activeTool.min) / range) * 100;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...adjustments, [activeKey]: parseInt(e.target.value) }, false),
  [onChange, adjustments, activeKey]);

  const handleCommit = useCallback((e: any) => {
    const v = parseInt((e.target as HTMLInputElement).value);
    if (!isNaN(v)) onChange({ ...adjustments, [activeKey]: v }, true);
  }, [onChange, adjustments, activeKey]);

  const handleReset = useCallback(() => onChange(DEFAULT_ADJUSTMENTS, true), [onChange]);

  const changedCount = useMemo(() =>
    allTools.filter(t =>
      adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments]
    ).length,
  [allTools, adjustments]);

  const toggleGroup = useCallback((id: string) =>
    setCollapsed(s => ({ ...s, [id]: !s[id] })),
  []);

  return (
    <div className="w-full h-full flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-between items-center px-5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.22em] text-[#4a4440] font-medium">Adjust</span>
          {changedCount > 0 && (
            <span
              className="text-[7px] px-1.5 py-0.5 rounded-full font-mono text-[#5a544c] tabular-nums"
              style={{ background: 'rgba(200,191,176,0.06)', border: '1px solid rgba(200,191,176,0.09)' }}
            >
              {changedCount}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[#3a3530] active:text-[#c8bfb0] transition-colors px-2.5 py-1 rounded-full active:bg-white/[0.04]"
        >
          <RotateCcw className="w-2.5 h-2.5" strokeWidth={2} />
          <span className="text-[8px] uppercase tracking-[0.12em] font-medium">Reset</span>
        </button>
      </div>

      {/* ── Active slider ───────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 pb-3.5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#c8bfb0]/75 font-semibold">
            {activeTool.label}
          </span>
          <span className={`text-[11px] font-mono tabular-nums transition-colors ${
            val === 0 ? 'text-[#2e2a26]' : 'text-[#c8bfb0]'
          }`}>
            {val > 0 ? `+${val}` : val}
          </span>
        </div>

        <div className="relative w-full h-8 flex items-center">
          <input
            type="range" min={activeTool.min} max={activeTool.max} value={val}
            onChange={handleChange}
            onPointerUp={handleCommit}
            onTouchEnd={handleCommit}
            onKeyUp={e => {
              if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) handleCommit(e);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ touchAction: "pan-y" }}
          />

          {/* Track */}
          <div className="w-full h-[2px] rounded-full relative" style={{ background: 'rgba(200,191,176,0.09)' }}>
            {/* Centre tick for bipolar sliders */}
            {activeTool.min < 0 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-px h-3 -top-[5px] rounded-full"
                style={{ background: 'rgba(200,191,176,0.18)' }}
              />
            )}
            {/* Fill */}
            <div
              className="absolute h-full rounded-full transition-[width,left] duration-0"
              style={{
                background: val === 0 ? 'transparent' : 'rgba(200,191,176,0.65)',
                left:  activeTool.min < 0 ? '50%' : '0%',
                width: activeTool.min < 0
                  ? `${Math.abs(val / range) * 100}%`
                  : `${pct}%`,
                transform: activeTool.min < 0 && val < 0 ? 'translateX(-100%)' : 'none',
              }}
            />
          </div>

          {/* Thumb */}
          <div
            className="absolute w-[18px] h-[18px] rounded-full pointer-events-none"
            style={{
              left: `${pct}%`,
              transform: 'translateX(-50%)',
              background: '#e8e4df',
              boxShadow: '0 1px 8px rgba(0,0,0,0.55)',
            }}
          />
        </div>
      </div>

      {/* ── Tool groups ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-y-contain pb-4">
        {GROUPS.map(group => {
          const isCollapsed  = !!collapsed[group.id];
          const groupChanged = group.tools.some(
            t => adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments],
          );
          const changedInGroup = group.tools.filter(
            t => adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments],
          ).length;

          return (
            <div key={group.id}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-5 py-2 active:bg-white/[0.015] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className="w-2.5 h-2.5 transition-transform duration-200"
                    style={{
                      color: 'rgba(200,191,176,0.18)',
                      transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                    }}
                    strokeWidth={2.5}
                  />
                  <span className="text-[8px] uppercase tracking-[0.18em] font-semibold text-[#3a3530]">
                    {group.label}
                  </span>
                </div>
                {groupChanged && (
                  <span
                    className="text-[6.5px] font-mono text-[#5a544c] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{ background: 'rgba(200,191,176,0.06)' }}
                  >
                    {changedInGroup}
                  </span>
                )}
              </button>

              {/* Tools grid */}
              {!isCollapsed && (
                <div className="flex overflow-x-auto no-scrollbar scroll-x-contain gap-1.5 px-4 pb-2.5">
                  {group.tools.map(tool => {
                    if (!tool) return null;
                    const Icon      = tool.icon;
                    const isActive  = activeKey === tool.key;
                    const toolVal   = adjustments[tool.key as keyof Adjustments];
                    const isDef     = DEFAULT_ADJUSTMENTS[tool.key as keyof Adjustments];
                    const isChanged = toolVal !== isDef;

                    return (
                      <button
                        key={tool.key}
                        onClick={() => setActiveKey(tool.key as keyof Adjustments)}
                        className="relative flex flex-col items-center justify-center flex-shrink-0 w-[56px] h-[58px] rounded-xl transition-all duration-150 active:scale-95"
                        style={{
                          background: isActive
                            ? '#e8e4df'
                            : isChanged
                              ? 'rgba(200,191,176,0.07)'
                              : 'rgba(255,255,255,0.025)',
                          border: isActive
                            ? 'none'
                            : `1px solid ${isChanged ? 'rgba(200,191,176,0.11)' : 'rgba(255,255,255,0.035)'}`,
                        }}
                      >
                        <Icon
                          className="w-[14px] h-[14px] mb-1"
                          strokeWidth={1.5}
                          style={{ color: isActive ? '#060504' : isChanged ? '#b8b0a4' : '#2e2a26' }}
                        />
                        <span
                          className="text-[6.5px] uppercase tracking-[0.06em] font-bold text-center leading-tight"
                          style={{ color: isActive ? '#060504' : '#2e2a26' }}
                        >
                          {tool.label}
                        </span>

                        {/* Changed value badge */}
                        {isChanged && !isActive && (
                          <div
                            className="absolute -top-1 -right-1 min-w-[18px] h-[13px] px-1 flex items-center justify-center rounded-full"
                            style={{ background: 'rgba(200,191,176,0.13)' }}
                          >
                            <span className="text-[5.5px] font-mono text-[#b8b0a4] tabular-nums">
                              {toolVal > 0 ? `+${toolVal}` : toolVal}
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
  );
}
