import React, { useState } from 'react';
import { Camera, Image as ImageIcon, Grid, Plus, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Photo } from '../types';
import { FILTERS } from '../lib/filters';
import { getAdjustmentCss } from '../lib/utils';

interface StudioProps {
  photos: Photo[];
  onOpenCamera: () => void;
  onOpenPhoto: (photo: Photo) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: (id: string) => void;
}

export default function Studio({ photos, onOpenCamera, onOpenPhoto, onImport, onDelete }: StudioProps) {
  const [deleteMode, setDeleteMode] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const handlePhotoTap = (photo: Photo) => {
    if (deleteMode) {
      setPendingDelete(photo.id);
    } else {
      onOpenPhoto(photo);
    }
  };

  const confirmDelete = () => {
    if (pendingDelete) {
      onDelete(pendingDelete);
      setPendingDelete(null);
    }
  };

  const cancelDelete = () => setPendingDelete(null);

  const exitDeleteMode = () => {
    setDeleteMode(false);
    setPendingDelete(null);
  };

  const sorted = [...photos].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex flex-col h-full bg-[#030303] text-white relative overflow-hidden">

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-5 pt-12 pb-4 sm:px-6 sm:pt-14 flex justify-between items-start z-10 relative">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl sm:text-3xl font-serif italic font-light tracking-wide text-white/90">
            Fuad's Studio
          </h1>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-white/30 font-sans">
            Analog Photo Editor
          </span>
        </div>

        {photos.length > 0 && (
          <button
            onClick={deleteMode ? exitDeleteMode : () => setDeleteMode(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[9px] uppercase tracking-[0.12em] font-bold transition-all active:scale-95 mt-1 ${
              deleteMode
                ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                : 'bg-white/8 text-white/70 border border-white/12 active:bg-white/15'
            }`}
          >
            {deleteMode ? (
              <><X className="w-3 h-3" strokeWidth={2.5} /> Done</>
            ) : (
              <><Trash2 className="w-3 h-3" strokeWidth={2} /> Select</>
            )}
          </button>
        )}
      </header>

      {/* ─── Photo Grid ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-2 sm:px-3 pb-32 no-scrollbar scroll-y-contain z-10">
        {sorted.length === 0 ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-6 mt-[-8vh]">
            <div className="relative">
              <div className="w-28 h-28 rounded-full border border-white/8 flex items-center justify-center bg-gradient-to-b from-white/[0.03] to-transparent">
                <ImageIcon className="w-10 h-10 opacity-25" strokeWidth={1} />
              </div>
              <label className="absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-xl cursor-pointer active:scale-90 transition-transform">
                <input type="file" accept="image/*" className="hidden" onChange={onImport} />
                <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
              </label>
            </div>
            <div className="text-center space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-white/50">
                Your studio is empty
              </p>
              <p className="text-[11px] text-white/25 max-w-[220px] font-light leading-relaxed">
                Import a photograph or capture a new moment to begin editing.
              </p>
            </div>
          </div>
        ) : (
          /* Photo grid */
          <div className="grid grid-cols-3 gap-[2px] sm:gap-1">
            {sorted.map((photo) => {
              const filter = FILTERS.find((f) => f.id === photo.filterId);
              const isPending = pendingDelete === photo.id;

              return (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`aspect-square bg-zinc-900/50 cursor-pointer overflow-hidden relative rounded-sm sm:rounded-md active:scale-[0.97] transition-transform duration-150 ${
                    isPending ? 'ring-2 ring-red-500 ring-offset-1 ring-offset-black' : ''
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
                      alt=""
                      draggable={false}
                      loading="lazy"
                    />
                    {filter && filter.css !== 'none' && (
                      <img
                        src={photo.src}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: filter.css, opacity: (photo.filterIntensity ?? 100) / 100 }}
                        alt=""
                        draggable={false}
                        loading="lazy"
                      />
                    )}
                  </div>

                  {/* Delete mode overlay */}
                  {deleteMode && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-100 ${
                      isPending ? 'bg-red-500/30' : 'bg-black/15'
                    }`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                        isPending
                          ? 'bg-red-500 border-red-400 scale-110'
                          : 'border-white/30 bg-black/30'
                      }`}>
                        {isPending && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Delete confirmation ────────────────────────────────────── */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="absolute bottom-28 left-3 right-3 z-30 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl border border-red-500/20 rounded-2xl px-5 py-3.5 shadow-2xl"
          >
            <span className="text-[11px] text-white/70 font-medium">Delete this photo?</span>
            <div className="flex gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-1.5 rounded-full bg-white/8 text-white/60 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom nav ─────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 flex items-center gap-8 z-20 border border-white/[0.06] bg-black/50 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        <button className="text-white/35 active:text-white active:scale-90 transition-all p-1">
          <Grid className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenCamera}
          className="w-12 h-12 bg-white text-black rounded-full shadow-[0_0_24px_rgba(255,255,255,0.12)] flex items-center justify-center active:scale-90 transition-all"
        >
          <Camera className="w-5 h-5" fill="currentColor" />
        </button>

        <label className="text-white/35 active:text-white active:scale-90 cursor-pointer transition-all p-1">
          <input type="file" accept="image/*" className="hidden" onChange={onImport} />
          <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
        </label>
      </div>
    </div>
  );
}
