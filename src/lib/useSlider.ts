import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Decouples slider visual state from the React prop cycle.
 *
 * - Thumb position driven by LOCAL state → instant response
 * - Parent onChange batched via rAF → max 60fps, never blocks UI
 * - Handlers are STABLE references (never recreated) → zero child re-renders
 *   from callback identity changes
 * - Syncs from parent only when NOT dragging (undo / filter switch / reset)
 */
export function useSlider(
  value: number,
  min: number,
  max: number,
  onChange: (v: number) => void,
  onCommit: (v: number) => void,
) {
  const [local, setLocal] = useState(value);
  const dragging = useRef(false);
  const raf      = useRef(0);

  // Keep latest callbacks in refs — avoids stale closures without recreating handlers
  const onChangeRef = useRef(onChange);
  const onCommitRef = useRef(onCommit);
  onChangeRef.current = onChange;
  onCommitRef.current = onCommit;

  // Keep min/max in refs so handlers stay stable even if range changes
  const minRef = useRef(min);
  const maxRef = useRef(max);
  minRef.current = min;
  maxRef.current = max;

  // Sync from parent when NOT dragging (filter switch, undo, reset)
  useEffect(() => {
    if (!dragging.current) setLocal(value);
  }, [value]);

  // Stable handleChange — NEVER recreated
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(maxRef.current, Math.max(minRef.current, parseInt(e.target.value)));
    dragging.current = true;
    setLocal(v);                                             // Instant visual
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => onChangeRef.current(v)); // Batched
  }, []);

  // Stable handleCommit — NEVER recreated
  const handleCommit = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    dragging.current = false;
    cancelAnimationFrame(raf.current);
    const raw = (e.target as HTMLInputElement).value;
    if (raw === '') return;
    const v = Math.min(maxRef.current, Math.max(minRef.current, parseInt(raw)));
    setLocal(v);
    onCommitRef.current(v);
  }, []);

  const range = max - min;
  const pct   = range === 0 ? 0 : ((local - min) / range) * 100;

  return { local, pct, handleChange, handleCommit };
}
