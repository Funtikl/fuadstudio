import React from 'react';
import { Camera, Image as ImageIcon, Grid, Sparkles, Plus } from 'lucide-react';
import { Photo } from '../types';
import { FILTERS } from '../lib/filters';
import { getAdjustmentCss } from '../lib/utils';

interface StudioProps {
  photos: Photo[];
  onOpenCamera: () => void;
  onOpenPhoto: (photo: Photo) => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Studio({ photos, onOpenCamera, onOpenPhoto, onImport }: StudioProps) {
  return (
    <div className="flex flex-col h-full bg-[#050505] text-white relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/20 via-black to-black pointer-events-none" />
      
      <header className="px-6 pt-12 pb-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-serif italic font-light tracking-wide text-white/90">Fuad's Studio</h1>
          <span className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-sans">Analog Photo Editor</span>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar z-10">
        {photos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-8 mt-[-10vh]">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent shadow-[0_0_60px_rgba(255,255,255,0.03)] transition-all duration-700 group-hover:shadow-[0_0_80px_rgba(255,255,255,0.08)] group-hover:border-white/20">
                <ImageIcon className="w-12 h-12 opacity-30 transition-opacity duration-500 group-hover:opacity-60" strokeWidth={1} />
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:scale-110 transition-transform duration-300">
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
            {photos.sort((a, b) => b.createdAt - a.createdAt).map(photo => {
              const filter = FILTERS.find(f => f.id === photo.filterId);
              const combinedCss = `${filter?.css !== 'none' ? filter?.css : ''} ${photo.adjustments ? getAdjustmentCss(photo.adjustments) : ''}`.trim() || 'none';
              
              return (
                <div 
                  key={photo.id} 
                  className="aspect-square bg-zinc-900 cursor-pointer overflow-hidden relative group rounded-md shadow-sm"
                  onClick={() => onOpenPhoto(photo)}
                >
                  <div className="w-full h-full relative transition-transform duration-700 group-hover:scale-110" style={{ filter: photo.adjustments ? getAdjustmentCss(photo.adjustments) : 'none' }}>
                    <img 
                      src={photo.src} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      alt="Studio item"
                    />
                    {filter && filter.css !== 'none' && (
                      <img 
                        src={photo.src} 
                        className="absolute inset-0 w-full h-full object-cover" 
                        style={{ filter: filter.css, opacity: (photo.filterIntensity ?? 100) / 100 }} 
                        alt="Studio item filter"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 glass-panel rounded-full px-8 py-4 flex items-center gap-10 shadow-2xl z-20 border border-white/5 bg-black/40 backdrop-blur-2xl">
        <button className="text-white/40 hover:text-white transition-colors flex flex-col items-center gap-1">
          <Grid className="w-5 h-5" strokeWidth={1.5} />
        </button>
        
        <button 
          onClick={onOpenCamera} 
          className="w-14 h-14 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
        >
          <Camera className="w-6 h-6" fill="currentColor" />
        </button>
        
        <label className="text-white/40 hover:text-white flex flex-col items-center gap-1 cursor-pointer transition-colors">
          <input type="file" accept="image/*" className="hidden" onChange={onImport} />
          <ImageIcon className="w-5 h-5" strokeWidth={1.5} />
        </label>
      </div>
    </div>
  );
}
