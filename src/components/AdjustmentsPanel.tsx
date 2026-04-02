import React, { useState, useCallback, useMemo, useRef } from "react";
import { useSlider } from "../lib/useSlider";
import { Adjustments, DEFAULT_ADJUSTMENTS } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun, Contrast, Droplet, Thermometer, Palette, Image as ImageIcon,
  CloudFog, Focus, Sparkles, CircleDashed, ArrowUpCircle, ArrowDownCircle,
  Zap, Pipette, PaintBucket, FlipHorizontal, RotateCcw, Diamond,
  ScanSearch, Eclipse, Wind, Flower, Layers, Aperture, Disc, Flame,
  LayoutGrid, Moon, Sunrise, Hash, ScanLine, Star, Box, Heart, ChevronDown
} from "lucide-react";

interface Props {
  adjustments: Adjustments;
  onChange: (adj: Adjustments, isFinal?: boolean) => void;
}

interface ToolDef {
  key: keyof Adjustments;
  label: string;
  icon: React.ElementType;
  min: number;
  max: number;
  group: string;
}

const TOOLS: ToolDef[] = [
  // İşıq-Kölgə
  { key: "exposure",   label: "Ekspozisiya", icon: Sun,             min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "gamma",      label: "Qamma",       icon: CircleDashed,    min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "brightness", label: "Parlaqlıq",   icon: Sun,             min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "contrast",   label: "Kontrast",    icon: Contrast,        min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "whites",     label: "Ağlar",       icon: Sun,             min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "highlights", label: "Açıq-rəng",   icon: ArrowUpCircle,   min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "midtones",   label: "Orta tonlar", icon: CircleDashed,    min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "shadows",    label: "Kölgələr",    icon: ArrowDownCircle, min: -100, max: 100, group: "İşıq-Kölgə" },
  { key: "blacks",     label: "Qaralar",     icon: Moon,            min: -100, max: 100, group: "İşıq-Kölgə" },
  // Detal
  { key: "sharpness",        label: "Kəskinlik", icon: Diamond,    min: 0, max: 100, group: "Detal" },
  { key: "clarity",          label: "Aydınlıq",  icon: Eclipse,    min: -100, max: 100, group: "Detal" },
  { key: "microContrast",    label: "Mikro",     icon: Box,        min: 0, max: 100, group: "Detal" },
  { key: "detail",           label: "Detal",     icon: ScanSearch, min: 0, max: 100, group: "Detal" },
  { key: "dehaze",           label: "Dumanlılıq",icon: Wind,       min: -100, max: 100, group: "Detal" },
  { key: "highlightRolloff", label: "Rollof",    icon: Sun,        min: 0, max: 100, group: "Detal" },
  // Rəng
  { key: "saturation",         label: "Doyğunluq", icon: Droplet,     min: -100, max: 100, group: "Rəng" },
  { key: "vibrance",           label: "Vibrans",   icon: Zap,         min: -100, max: 100, group: "Rəng" },
  { key: "warmth",             label: "İstilik",   icon: Thermometer, min: -100, max: 100, group: "Rəng" },
  { key: "tint",               label: "Çalar",     icon: Pipette,     min: -100, max: 100, group: "Rəng" },
  { key: "hue",                label: "Rəng-tonu", icon: Palette,     min: -180, max: 180, group: "Rəng" },
  { key: "splitToneShadow",    label: "Kölgə-ton", icon: Moon,        min: -180, max: 180, group: "Rəng" },
  { key: "splitToneHighlight", label: "Parlaq-ton", icon: Sunrise,    min: -180, max: 180, group: "Rəng" },
  // FX
  { key: "fade",         label: "Solğunluq", icon: Layers, min: 0, max: 100, group: "FX" },
  { key: "vignette",     label: "Vinyet",    icon: Focus,  min: 0, max: 100, group: "FX" },
  { key: "bloom",        label: "Parıltı",   icon: Flower, min: 0, max: 100, group: "FX" },
  { key: "softFocus",    label: "Yumşaq",    icon: Disc,   min: 0, max: 100, group: "FX" },
  { key: "portraitGlow", label: "Göy",       icon: Heart,  min: 0, max: 100, group: "FX" },
  // Film
  { key: "grain",               label: "Taxıl",     icon: Sparkles,    min: 0, max: 100, group: "Film" },
  { key: "halation",            label: "Halasiya",  icon: Eclipse,     min: 0, max: 100, group: "Film" },
  { key: "lightLeak",           label: "Sızma",     icon: Zap,         min: 0, max: 100, group: "Film" },
  { key: "filmBurn",            label: "Yanıq",     icon: Flame,       min: 0, max: 100, group: "Film" },
  { key: "dust",                label: "Toz",       icon: CircleDashed,min: 0, max: 100, group: "Film" },
  { key: "chromaticAberration", label: "Xromatik",  icon: Aperture,    min: 0, max: 100, group: "Film" },
  // Klassik
  { key: "sepia",     label: "Sepiya",    icon: ImageIcon,      min: 0, max: 100, group: "Klassik" },
  { key: "grayscale", label: "Ağ-qara",   icon: PaintBucket,    min: 0, max: 100, group: "Klassik" },
  { key: "invert",    label: "İnvert",    icon: FlipHorizontal, min: 0, max: 100, group: "Klassik" },
  { key: "blur",      label: "Bulanıq",   icon: CloudFog,       min: 0, max: 100, group: "Klassik" },
  // Kreativ
  { key: "dispersion", label: "Dağılma",   icon: Star,      min: 0, max: 100, group: "Kreativ" },
  { key: "posterize",  label: "Poster",    icon: LayoutGrid,min: 0, max: 100, group: "Kreativ" },
  { key: "pixelate",   label: "Piksel",    icon: Hash,      min: 0, max: 100, group: "Kreativ" },
  { key: "scanLines",  label: "Skan-xətt", icon: ScanLine,  min: 0, max: 100, group: "Kreativ" },
];

const GROUP_COLORS: Record<string, string> = {
  "İşıq-Kölgə": 'rgba(200,191,176,0.14)',
  Detal:   'rgba(150,180,200,0.12)',
  Rəng:    'rgba(200,150,180,0.12)',
  FX:      'rgba(180,200,150,0.12)',
  Film:    'rgba(200,170,130,0.12)',
  Klassik: 'rgba(160,160,160,0.12)',
  Kreativ: 'rgba(180,150,200,0.12)',
};

const GROUPS = ["İşıq-Kölgə", "Detal", "Rəng", "FX", "Film", "Klassik", "Kreativ"];

function SliderRow({ tool, value, defVal, onChange, onCommit }: { tool: ToolDef, value: number, defVal: number, onChange: (k: keyof Adjustments, v: number)=>void, onCommit: (k: keyof Adjustments, v: number)=>void }) {
  const onChangeL = useCallback((v: number) => onChange(tool.key, v), [onChange, tool.key]);
  const onCommitL = useCallback((v: number) => onCommit(tool.key, v), [onCommit, tool.key]);
  
  const range = tool.max - tool.min;
  const { local: localVal, pct, handleChange, handleCommit } = useSlider(
    value, tool.min, tool.max, onChangeL, onCommitL,
  );

  return (
    <div className="flex-shrink-0 px-5 py-2">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-[0.15em] text-[#c8bfb0]/80 font-medium">
          {tool.label}
        </span>
        <span className={`text-[11px] font-mono tabular-nums font-medium transition-colors ${
          localVal === 0 ? 'text-[#5a544c]' : 'text-[#c8bfb0]'
        }`}>
          {localVal > 0 ? `+${localVal}` : localVal}
        </span>
      </div>

      <div className="relative w-full h-8 flex items-center">
        <input
          type="range" min={tool.min} max={tool.max} value={localVal}
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
          {tool.min < 0 && (
            <div
              className="absolute left-1/2 -translate-x-1/2 w-px h-[10px] -top-[3.5px] rounded-full"
              style={{ background: 'rgba(200,191,176,0.25)' }}
            />
          )}
          <div
            className="absolute h-full rounded-full pointer-events-none"
            style={{
              background: localVal === 0 ? 'transparent' : 'rgba(200,191,176,0.70)',
              left:  tool.min < 0 ? '50%' : '0%',
              width: tool.min < 0
                ? `${Math.abs(localVal / Math.max(range, 1)) * 100}%`
                : `${pct}%`,
              transform: tool.min < 0 && localVal < 0 ? 'translateX(-100%)' : 'none',
            }}
          />
        </div>
        {/* Thumb */}
        <div
          className="absolute w-[18px] h-[18px] rounded-full pointer-events-none"
          style={{
            left: `${pct}%`,
            transform: 'translateX(-50%)',
            background: localVal === 0 ? '#8a847c' : '#e8e4df',
            boxShadow: '0 2px 5px rgba(0,0,0,0.40)',
          }}
        />
      </div>
    </div>
  );
}

export default function AdjustmentsPanel({ adjustments, onChange }: Props) {
  const [openGroup, setOpenGroup] = useState<string>("İşıq-Kölgə");
  const adjRef = useRef(adjustments);
  const onChangeR = useRef(onChange);
  adjRef.current = adjustments;
  onChangeR.current = onChange;

  const onChangeSt = useCallback((k: keyof Adjustments, v: number) =>
    onChangeR.current({ ...adjRef.current, [k]: v }, false), []);
  const onCommitSt = useCallback((k: keyof Adjustments, v: number) =>
    onChangeR.current({ ...adjRef.current, [k]: v }, true),  []);

  const handleReset = useCallback(() => onChangeR.current(DEFAULT_ADJUSTMENTS, true), []);

  const changedCount = useMemo(() =>
    TOOLS.filter(t =>
      adjustments[t.key] !== DEFAULT_ADJUSTMENTS[t.key]
    ).length,
  [adjustments]);

  return (
    <div className="w-full h-full flex flex-col select-none overflow-hidden" style={{ minHeight: 0 }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex justify-between items-center px-4 pt-3 pb-2 border-b border-[#c8bfb0]/10">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.22em] text-[#3a3530] font-bold">Nizamla</span>
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
          className="flex items-center gap-1 text-[#5a544c] active:text-[#c8bfb0] transition-colors"
        >
          <RotateCcw className="w-3 h-3" strokeWidth={2} />
          <span className="text-[8px] uppercase tracking-[0.12em] font-medium">Sıfırla</span>
        </button>
      </div>

      {/* ── Accordion List ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {GROUPS.map((group) => {
          const groupTools = TOOLS.filter(t => t.group === group);
          const isOpen = openGroup === group;
          const bg = GROUP_COLORS[group];

          // Count active tools in this group
          const activeInGroup = groupTools.filter(
            t => adjustments[t.key] !== DEFAULT_ADJUSTMENTS[t.key]
          ).length;

          return (
            <div key={group} className="border-b border-[#c8bfb0]/5">
              <button
                onClick={() => setOpenGroup(isOpen ? "" : group)}
                className="w-full flex items-center justify-between px-5 py-4 transition-colors active:bg-[#c8bfb0]/5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] uppercase tracking-[0.18em] font-medium"
                    style={{ color: isOpen ? '#e8e4df' : (activeInGroup > 0 ? '#c8bfb0' : '#5a544c') }}
                  >
                    {group}
                  </span>
                  {activeInGroup > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: bg }} />
                  )}
                </div>
                <motion.div
                  initial={false}
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-[#5a544c]" strokeWidth={1.5} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-3 bg-[#0a0806]/40">
                      {groupTools.map(tool => (
                        <div key={tool.key as string}>
                          <SliderRow
                            tool={tool}
                            value={adjustments[tool.key]}
                            defVal={DEFAULT_ADJUSTMENTS[tool.key]}
                            onChange={onChangeSt}
                            onCommit={onCommitSt}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
