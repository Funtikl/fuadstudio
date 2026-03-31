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
    <div className="flex flex-col h-full bg-[#050505] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-black to-black pointer-events-none" />

      <header className="px-6 pt-12 pb-6 flex justify-between items-center z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-serif italic font-light tracking-wide text-white/90">Fuad's Studio</h1>
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans">Analog Photo Editor</span>
        </div>

        {/* Delete mode toggle — only shown when there are photos */}
        {photos.length > 0 && (
          <button
            onClick={deleteMode ? exitDeleteMode : () => setDeleteMode(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest font-semibold transition-all active:scale-95 ${
              deleteMode
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/10 text-white/80 border border-white/20 active:bg-white/20'
            }`}
          >
            {deleteMode ? <><X className="w-3 h-3" /> Done</> : <><Trash2 className="w-3 h-3" /> Select</>}
          </button>
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar z-10">
        {sorted.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-8 mt-[-10vh]">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent shadow-[0_0_60px_rgba(255,255,255,0.03)] transition-all duration-700 group-hover:shadow-[0_0_80px_rgba(255,255,255,0.08)] group-hover:border-white/20">
                <ImageIcon className="w-12 h-12 opacity-30 transition-opacity duration-500 group-hover:opacity-60" strokeWidth={1} />
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200">
                <input type="file" accept="image/*" className="hidden" onChange={onImport} />
                <Plus className="w-5 h-5 text-black" />
              </label>
            </div>
            <div className="text-center space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-white/60 font-sans">Your studio is empty</p>
              <p className="text-xs text-white/30 max-w-[240px] font-sans font-light leading-relaxed">Import a photograph or capture a new moment to begin your editing journey.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {sorted.map(photo => {
              const filter = FILTERS.find(f => f.id === photo.filterId);
              const isPending = pendingDelete === photo.id;

              return (
                <motion.div
                  key={photo.id}
                  layout
                  className={`aspect-square bg-zinc-900 cursor-pointer overflow-hidden relative rounded-md shadow-sm transition-all duration-200 ${
                    deleteMode ? 'ring-1 ring-white/10' : ''
                  } ${isPending ? 'ring-2 ring-red-500' : ''}`}
                  onClick={() => handlePhotoTap(photo)}
                >
                  <div className="w-full h-full relative" style={{ filter: photo.adjustments ? getAdjustmentCss(photo.adjustments) : 'none' }}>
                    <img
                      src={photo.src}
                      className="absolute inset-0 w-full h-full object-cover"
                      alt="Studio item"
                      draggable={false}
                    />
                    {filter && filter.css !== 'none' && (
                      <img
                        src={photo.src}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: filter.css, opacity: (photo.filterIntensity ?? 100) / 100 }}
                        alt=""
                        draggable={false}
                      />
                    )}
                  </div>

                  {/* Delete mode overlay */}
                  {deleteMode && (
                    <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-150 ${
                      isPending ? 'bg-red-500/40' : 'bg-black/20'
                    }`}>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isPending ? 'bg-red-500 border-red-400' : 'border-white/40 bg-black/20'
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

      {/* Delete confirmation bar */}
      <AnimatePresence>
        {pendingDelete && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-28 left-4 right-4 z-30 flex items-center justify-between bg-zinc-900 border border-red-500/30 rounded-2xl px-5 py-4 shadow-2xl"
          >
            <span className="text-sm text-white/80">Delete this photo?</span>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-semibold active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-panel rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl z-20 border border-white/5 bg-black/40 backdrop-blur-2xl">
        <button className="text-white/40 hover:text-white active:scale-90 transition-all flex flex-col items-center gap-1">
          <Grid className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenCamera}
          className="w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center active:scale-90 transition-all duration-200"
        >
          <Camera className="w-6 h-6" fill="currentColor" />
        </button>

        <label className="text-white/40 hover:text-white active:scale-90 flex flex-col items-center gap-1 cursor-pointer transition-all">
          <input type="file" accept="image/*" className="hidden" onChange={onImport} />
          <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
        </label>
      </div>
    </div>
  );
}
