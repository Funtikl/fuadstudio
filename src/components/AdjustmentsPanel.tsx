import React, { useState, useCallback, useMemo, useRef } from "react";
import { useSlider } from "../lib/useSlider";
import { Adjustments, DEFAULT_ADJUSTMENTS } from "../types";
import {
  Sun, Contrast, Droplet, Thermometer, Palette, Image as ImageIcon,
  CloudFog, Focus, Sparkles, CircleDashed, ArrowUpCircle, ArrowDownCircle,
  Zap, Pipette, PaintBucket, FlipHorizontal, RotateCcw, Diamond,
  ScanSearch, Eclipse, Wind, Flower, Layers, Aperture, Disc, Flame,
  LayoutGrid, Moon, Sunrise, Hash, ScanLine, Star, Box, Heart,
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
  group: string;
}

// Flat ordered list of all tools — no accordion, just scroll
const TOOLS: ToolDef[] = [
  // Tone
  { key: "exposure",   label: "Exposure",   icon: Sun,             min: -100, max: 100, group: "Tone" },
  { key: "brightness", label: "Bright",     icon: CircleDashed,    min: -100, max: 100, group: "Tone" },
  { key: "contrast",   label: "Contrast",   icon: Contrast,        min: -100, max: 100, group: "Tone" },
  { key: "highlights", label: "Highs",      icon: ArrowUpCircle,   min: -100, max: 100, group: "Tone" },
  { key: "shadows",    label: "Shadows",    icon: ArrowDownCircle, min: -100, max: 100, group: "Tone" },
  // Detail
  { key: "sharpness",        label: "Sharpen", icon: Diamond,    min: 0, max: 100, group: "Detail" },
  { key: "clarity",          label: "Clarity", icon: Eclipse,    min: -100, max: 100, group: "Detail" },
  { key: "microContrast",    label: "Micro",   icon: Box,        min: 0, max: 100, group: "Detail" },
  { key: "detail",           label: "Detail",  icon: ScanSearch, min: 0, max: 100, group: "Detail" },
  { key: "dehaze",           label: "Dehaze",  icon: Wind,       min: -100, max: 100, group: "Detail" },
  { key: "highlightRolloff", label: "Rolloff", icon: Sun,        min: 0, max: 100, group: "Detail" },
  // Color
  { key: "saturation",         label: "Saturat",  icon: Droplet,     min: -100, max: 100, group: "Color" },
  { key: "vibrance",           label: "Vibrance", icon: Zap,         min: -100, max: 100, group: "Color" },
  { key: "warmth",             label: "Warmth",   icon: Thermometer, min: -100, max: 100, group: "Color" },
  { key: "tint",               label: "Tint",     icon: Pipette,     min: -100, max: 100, group: "Color" },
  { key: "hue",                label: "Hue",      icon: Palette,     min: -180, max: 180, group: "Color" },
  { key: "splitToneShadow",    label: "Shd Hue",  icon: Moon,        min: -180, max: 180, group: "Color" },
  { key: "splitToneHighlight", label: "Hi Hue",   icon: Sunrise,     min: -180, max: 180, group: "Color" },
  // Effects
  { key: "fade",         label: "Fade",    icon: Layers, min: 0, max: 100, group: "FX" },
  { key: "vignette",     label: "Vignette",icon: Focus,  min: 0, max: 100, group: "FX" },
  { key: "bloom",        label: "Bloom",   icon: Flower, min: 0, max: 100, group: "FX" },
  { key: "softFocus",    label: "SoftFx",  icon: Disc,   min: 0, max: 100, group: "FX" },
  { key: "portraitGlow", label: "Glow",    icon: Heart,  min: 0, max: 100, group: "FX" },
  // Analog
  { key: "grain",               label: "Grain",   icon: Sparkles,    min: 0, max: 100, group: "Film" },
  { key: "halation",            label: "Halation",icon: Eclipse,     min: 0, max: 100, group: "Film" },
  { key: "lightLeak",           label: "Leak",    icon: Zap,         min: 0, max: 100, group: "Film" },
  { key: "filmBurn",            label: "Burn",    icon: Flame,       min: 0, max: 100, group: "Film" },
  { key: "dust",                label: "Dust",    icon: CircleDashed,min: 0, max: 100, group: "Film" },
  { key: "chromaticAberration", label: "Chroma",  icon: Aperture,    min: 0, max: 100, group: "Film" },
  // Classic
  { key: "sepia",     label: "Sepia",     icon: ImageIcon,      min: 0, max: 100, group: "Classic" },
  { key: "grayscale", label: "B&W",       icon: PaintBucket,    min: 0, max: 100, group: "Classic" },
  { key: "invert",    label: "Invert",    icon: FlipHorizontal, min: 0, max: 100, group: "Classic" },
  { key: "blur",      label: "Blur",      icon: CloudFog,       min: 0, max: 100, group: "Classic" },
  // Creative
  { key: "dispersion", label: "Scatter", icon: Star,      min: 0, max: 100, group: "Creative" },
  { key: "posterize",  label: "Poster",  icon: LayoutGrid,min: 0, max: 100, group: "Creative" },
  { key: "pixelate",   label: "Pixel",   icon: Hash,      min: 0, max: 100, group: "Creative" },
  { key: "scanLines",  label: "Scan",    icon: ScanLine,  min: 0, max: 100, group: "Creative" },
];

const FALLBACK = TOOLS[0];

// Group colour accents (subtle)
const GROUP_COLORS: Record<string, string> = {
  Tone:    'rgba(200,191,176,0.14)',
  Detail:  'rgba(150,180,200,0.12)',
  Color:   'rgba(200,150,180,0.12)',
  FX:      'rgba(180,200,150,0.12)',
  Film:    'rgba(200,170,130,0.12)',
  Classic: 'rgba(160,160,160,0.12)',
  Creative:'rgba(180,150,200,0.12)',
};

export default function AdjustmentsPanel({ adjustments, onChange }: Props) {
  const [activeKey, setActiveKey] = useState<keyof Adjustments>("exposure");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeTool = useMemo(
    () => TOOLS.find(t => t.key === activeKey) || FALLBACK,
    [activeKey],
  );

  const committedVal = adjustments[activeKey] ?? 0;

  // Refs so slider handlers stay stable across adjustments/activeKey changes
  const adjRef     = useRef(adjustments);
  const activeKeyR = useRef(activeKey);
  const onChangeR  = useRef(onChange);
  adjRef.current     = adjustments;
  activeKeyR.current = activeKey;
  onChangeR.current  = onChange;

  const onChangeSt = useCallback((v: number) =>
    onChangeR.current({ ...adjRef.current, [activeKeyR.current]: v }, false), []);
  const onCommitSt = useCallback((v: number) =>
    onChangeR.current({ ...adjRef.current, [activeKeyR.current]: v }, true),  []);

  const range = activeTool.max - activeTool.min;
  const { local: localVal, pct, handleChange, handleCommit } = useSlider(
    committedVal, activeTool.min, activeTool.max, onChangeSt, onCommitSt,
  );

  const handleReset = useCallback(() => onChangeR.current(DEFAULT_ADJUSTMENTS, true), []);

  const changedCount = useMemo(() =>
    TOOLS.filter(t =>
      adjustments[t.key as keyof Adjustments] !== DEFAULT_ADJUSTMENTS[t.key as keyof Adjustments]
    ).length,
  [adjustments]);

  // Group dividers: collect unique groups in order
  const groups = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const t of TOOLS) {
      if (!seen.has(t.group)) { seen.add(t.group); list.push(t.group); }
    }
    return list;
  }, []);

  return (
    <div className="w-full flex flex-col select-none">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 pt-2.5 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-[0.22em] text-[#3a3530] font-semibold">Adjust</span>
          {changedCount > 0 && (
            <span
              className="text-[7px] px-1.5 py-0.5 rounded-full font-mono text-[#5a544c] tabular-nums"
              style={{ background: 'rgba(200,191,176,0.07)', border: '1px solid rgba(200,191,176,0.10)' }}
            >
              {changedCount}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[#2e2a26] active:text-[#c8bfb0] transition-colors"
        >
          <RotateCcw className="w-2.5 h-2.5" strokeWidth={2} />
          <span className="text-[8px] uppercase tracking-[0.12em] font-medium">Reset</span>
        </button>
      </div>

      {/* ── Active slider ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#c8bfb0]/80 font-semibold">
            {activeTool.label}
          </span>
          <span className={`text-[13px] font-mono tabular-nums font-medium transition-colors ${
            localVal === 0 ? 'text-[#2e2a26]' : 'text-[#c8bfb0]'
          }`}>
            {localVal > 0 ? `+${localVal}` : localVal}
          </span>
        </div>

        <div className="relative w-full h-12 flex items-center">
          <input
            type="range" min={activeTool.min} max={activeTool.max} value={localVal}
            onChange={handleChange}
            onPointerUp={handleCommit}
            onTouchEnd={handleCommit}
            onKeyUp={e => {
              if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) handleCommit(e as any);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ touchAction: "none" }}
          />
          {/* Track */}
          <div className="w-full h-[3px] rounded-full relative" style={{ background: 'rgba(200,191,176,0.10)' }}>
            {activeTool.min < 0 && (
              <div
                className="absolute left-1/2 -translate-x-1/2 w-px h-[14px] -top-[5.5px] rounded-full"
                style={{ background: 'rgba(200,191,176,0.20)' }}
              />
            )}
            <div
              className="absolute h-full rounded-full"
              style={{
                background: localVal === 0 ? 'transparent' : 'rgba(200,191,176,0.70)',
                left:  activeTool.min < 0 ? '50%' : '0%',
                width: activeTool.min < 0
                  ? `${Math.abs(localVal / range) * 100}%`
                  : `${pct}%`,
                transform: activeTool.min < 0 && localVal < 0 ? 'translateX(-100%)' : 'none',
              }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute w-[24px] h-[24px] rounded-full pointer-events-none"
            style={{
              left: `${pct}%`,
              transform: 'translateX(-50%)',
              background: '#e8e4df',
              boxShadow: '0 2px 10px rgba(0,0,0,0.40)',
            }}
          />
        </div>
      </div>

      {/* ── Separator ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 mx-4 mb-2" style={{ height: 1, background: 'rgba(200,191,176,0.07)' }} />

      {/* ── Horizontally scrollable tool icons ─────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-shrink-0 overflow-x-auto no-scrollbar pb-3 pt-0.5"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex items-center gap-0 px-3" style={{ width: 'max-content' }}>
          {groups.map((group, gi) => {
            const groupTools = TOOLS.filter(t => t.group === group);
            return (
              <React.Fragment key={group}>
                {/* Group divider (except before first group) */}
                {gi > 0 && (
                  <div
                    className="flex-shrink-0 mx-1.5"
                    style={{ width: 1, height: 36, background: 'rgba(200,191,176,0.09)' }}
                  />
                )}
                {/* Group label */}
                <div className="flex-shrink-0 flex flex-col items-center mr-1">
                  <span
                    className="text-[5.5px] uppercase tracking-[0.14em] font-semibold"
                    style={{ color: 'rgba(200,191,176,0.22)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.12em' }}
                  >
                    {group}
                  </span>
                </div>
                {/* Tools */}
                <div className="flex gap-1">
                  {groupTools.map(tool => {
                    const Icon     = tool.icon;
                    const isActive = activeKey === tool.key;
                    const toolVal  = adjustments[tool.key as keyof Adjustments];
                    const defVal   = DEFAULT_ADJUSTMENTS[tool.key as keyof Adjustments];
                    const isChanged = toolVal !== defVal;

                    return (
                      <button
                        key={tool.key}
                        onClick={() => setActiveKey(tool.key as keyof Adjustments)}
                        className="relative flex-shrink-0 flex flex-col items-center justify-center w-[52px] h-[52px] rounded-[14px] transition-all duration-120 active:scale-95"
                        style={{
                          background: isActive
                            ? '#e8e4df'
                            : isChanged
                              ? GROUP_COLORS[tool.group]
                              : 'rgba(255,255,255,0.022)',
                          border: isActive
                            ? 'none'
                            : `1px solid ${isChanged ? 'rgba(200,191,176,0.13)' : 'rgba(255,255,255,0.03)'}`,
                        }}
                      >
                        <Icon
                          className="w-[13px] h-[13px] mb-0.5"
                          strokeWidth={1.6}
                          style={{ color: isActive ? '#060504' : isChanged ? '#c0b8ae' : '#2e2a26' }}
                        />
                        <span
                          className="text-[6px] uppercase tracking-[0.04em] font-bold text-center leading-tight"
                          style={{ color: isActive ? '#060504' : isChanged ? '#b0a89e' : '#2e2a26' }}
                        >
                          {tool.label}
                        </span>

                        {/* Dot indicator for changed */}
                        {isChanged && !isActive && (
                          <div
                            className="absolute top-[5px] right-[5px] w-[5px] h-[5px] rounded-full"
                            style={{ background: 'rgba(200,191,176,0.55)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
