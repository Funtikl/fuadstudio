import React, { useState, useCallback } from 'react';
import { Camera, Image as ImageIcon, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Photo } from '../types';
import { FILTERS } from '../lib/filters';
import { getAdjustmentCss } from '../lib/utils';

interface StudioProps {
  photos: Photo[];
  onOpenCamera: () => void;
  onOpenPhoto:  (photo: Photo) => void;
  onImport:     (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete:     (id: string) => void;
}

export default function Studio({ photos, onOpenCamera, onOpenPhoto, onImport, onDelete }: StudioProps) {
  const [deleteMode, setDeleteMode]     = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handlePhotoTap = useCallback((photo: Photo) => {
    if (deleteMode) setPendingDelete(photo.id);
    else onOpenPhoto(photo);
  }, [deleteMode, onOpenPhoto]);

  const confirmDelete = useCallback(() => {
    if (pendingDelete) { onDelete(pendingDelete); setPendingDelete(null); }
  }, [pendingDelete, onDelete]);

  const exitDeleteMode = useCallback(() => { setDeleteMode(false); setPendingDelete(null); }, []);

  const sorted = [...photos].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-[#060504] text-[#e8e4df] relative overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(50,38,24,0.55) 0%, transparent 65%)' }} />

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-5 pt-14 pb-4 flex justify-between items-end z-10 relative">
        <div>
          <p className="text-[8px] uppercase tracking-[0.38em] text-[#3a3530] mb-1.5 font-medium">Analoq</p>
          <h1 className="text-[26px] font-serif italic font-light leading-none tracking-wide text-[#e8e4df]">
            Photo Studio
          </h1>
          {photos.length > 0 && (
            <p className="text-[8px] tracking-[0.12em] text-[#3a3530] mt-1.5 font-light tabular-nums">
              {photos.length} {photos.length === 1 ? 'foto' : 'foto'}
            </p>
          )}
        </div>

        {photos.length > 0 && (
          <button
            onClick={deleteMode ? exitDeleteMode : () => setDeleteMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-[0.1em] font-medium transition-all duration-200 active:scale-95 ${
              deleteMode
                ? 'text-red-400/80 border border-red-500/20 bg-red-950/30'
                : 'text-[#3a3530] border border-white/[0.06] bg-white/[0.03] active:bg-white/[0.08]'
            }`}
          >
            {deleteMode
              ? <><X className="w-3 h-3" strokeWidth={2} /> Hazırdır</>
              : <><Trash2 className="w-3 h-3" strokeWidth={1.5} /> Düzəlt</>
            }
          </button>
        )}
      </header>

      {/* ─── Content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto no-scrollbar scroll-y-contain z-10 pb-32">
        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-px">
            {sorted.map((photo, idx) => {
              const filter    = FILTERS.find(f => f.id === photo.filterId);
              const isPending = pendingDelete === photo.id;

              return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(idx * 0.025, 0.3) }}
                  className={`aspect-square bg-[#0c0a08] cursor-pointer overflow-hidden relative transition-opacity duration-100 active:opacity-75 ${
                    isPending ? 'ring-1 ring-inset ring-red-500/50' : ''
                  }`}
                  onClick={() => handlePhotoTap(photo)}
                >
                  <div
                    className="w-full h-full relative"
                    style={{ filter: photo.adjustments ? getAdjustmentCss(photo.adjustments) : 'none' }}
                  >
                    <img
                      src={photo.src}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="" draggable={false} loading="lazy"
                    />
                    {filter && filter.css !== 'none' && (
                      <img
                        src={photo.src}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: filter.css, opacity: (photo.filterIntensity ?? 100) / 100 }}
                        alt="" draggable={false} loading="lazy"
                      />
                    )}
                  </div>

                  {/* Delete mode overlay */}
                  <AnimatePresence>
                    {deleteMode && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute inset-0 flex items-end justify-end p-2 transition-colors duration-150 ${
                          isPending ? 'bg-red-950/60' : 'bg-black/25'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-150 ${
                          isPending ? 'bg-red-500 border-red-400 scale-110' : 'border-white/30 bg-black/40'
                        }`}>
                          {isPending && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Delete confirm bar ──────────────────────────────────────── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ y: 64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 64, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="absolute bottom-28 left-4 right-4 z-30 flex items-center justify-between rounded-2xl px-5 py-3.5"
            style={{
              background: 'rgba(10,7,5,0.96)',
              border: '1px solid rgba(239,68,68,0.14)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            <span className="text-[11px] text-[#c8bfb0]/65 font-light">Bu fotonu silək?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-wider text-[#5a544c] border border-white/[0.07] active:scale-95 transition-all"
              >
                İmtina
              </button>
              <button
                onClick={confirmDelete}
                className="px-3.5 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-wider bg-red-500/90 text-white active:scale-95 transition-all active:bg-red-600/90"
              >
                Sil
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom nav ──────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div
          className="flex items-center gap-7 px-7 py-3.5 rounded-full"
          style={{
            background: 'rgba(9,7,5,0.94)',
            border: '1px solid rgba(200,191,176,0.07)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          {/* Import from library */}
          <label className="text-[#3a3530] active:text-[#c8bfb0] active:scale-90 cursor-pointer transition-all duration-150 p-1">
            <input type="file" accept="image/*" multiple className="hidden" onChange={onImport} />
            <ImageIcon className="w-[22px] h-[22px]" strokeWidth={1.25} />
          </label>

          {/* Camera shutter */}
          <button
            onClick={onOpenCamera}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center active:scale-90 transition-all duration-150"
            style={{
              background: '#e8e4df',
              boxShadow: '0 2px 20px rgba(232,228,223,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            <Camera className="w-[22px] h-[22px] text-[#060504]" fill="currentColor" strokeWidth={0} />
          </button>

          {/* Placeholder (future tab) */}
          <div className="text-[#2a2520] p-1 pointer-events-none">
            <div className="w-[22px] h-[22px] rounded border border-current opacity-40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-sm bg-current opacity-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = React.memo(function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center min-h-[55vh] gap-9"
    >
      {/* Film frame */}
      <div className="relative">
        <div
          className="w-22 h-22 rounded-2xl flex items-center justify-center"
          style={{
            width: 88, height: 88,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.14)' }} />
          </div>
          {/* Film sprocket holes */}
          {[-1, 0, 1].map(i => (
            <React.Fragment key={i}>
              <div
                className="absolute w-[5px] h-[11px] rounded-sm"
                style={{
                  left: -8, top: `calc(50% + ${i * 18}px)`, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}
              />
              <div
                className="absolute w-[5px] h-[11px] rounded-sm"
                style={{
                  right: -8, top: `calc(50% + ${i * 18}px)`, transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}
              />
            </React.Fragment>
          ))}
        </div>

        {/* Import button */}
        <label
          className="absolute -bottom-2.5 -right-2.5 w-9 h-9 bg-[#e8e4df] rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-lg"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }}
        >
          <input type="file" accept="image/*" className="hidden" />
          <span className="text-[#060504] text-lg leading-none font-light select-none">+</span>
        </label>
      </div>

      <div className="text-center space-y-2.5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#c8bfb0]/50 font-medium">
          Studiyanız boşdur
        </p>
        <p className="text-[11px] text-[#3a3530] max-w-[190px] mx-auto font-light leading-relaxed">
          Başlamaq üçün foto yükləyin və ya çəkim düyməsinə toxunun.
        </p>
      </div>
    </motion.div>
  );
});
