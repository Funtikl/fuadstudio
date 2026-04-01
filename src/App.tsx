/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import Studio from './components/Studio';
import Camera from './components/Camera';
import PhotoEditor from './components/PhotoEditor';
import { Photo, Adjustments, DEFAULT_ADJUSTMENTS } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [view, setView] = useState<'studio' | 'camera' | 'editor'>('studio');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<{ src: string, filterId: string, filterIntensity?: number, adjustments: Adjustments, id?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('pearla_photos');
    if (saved) {
      try { setPhotos(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pearla_photos', JSON.stringify(photos));
  }, [photos]);

  const handleOpenCamera = useCallback(() => setView('camera'), []);
  
  const handleCloseCamera = useCallback(() => setView('studio'), []);

  const handleCapture = useCallback((src: string) => {
    setEditingPhoto({ src, filterId: 'standard', filterIntensity: 100, adjustments: DEFAULT_ADJUSTMENTS });
    setView('editor');
  }, []);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEditingPhoto({ src: event.target.result as string, filterId: 'standard', filterIntensity: 100, adjustments: DEFAULT_ADJUSTMENTS });
          setView('editor');
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleOpenPhoto = useCallback((photo: Photo) => {
    setEditingPhoto({ src: photo.src, filterId: photo.filterId, filterIntensity: photo.filterIntensity ?? 100, adjustments: photo.adjustments || DEFAULT_ADJUSTMENTS, id: photo.id });
    setView('editor');
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleCloseEditor = useCallback(() => {
    setEditingPhoto(null);
    setView('studio');
  }, []);

  const handleSaveEdit = useCallback((filterId: string, filterIntensity: number, adjustments: Adjustments) => {
    if (!editingPhoto) return;
    
    if (editingPhoto.id) {
      setPhotos(prev => prev.map(p => p.id === editingPhoto.id ? { ...p, filterId, filterIntensity, adjustments } : p));
    } else {
      const newPhoto: Photo = {
        id: Date.now().toString(),
        src: editingPhoto.src,
        filterId,
        filterIntensity,
        adjustments,
        createdAt: Date.now()
      };
      setPhotos(prev => [newPhoto, ...prev]);
    }
    setView('studio');
    setEditingPhoto(null);
  }, [editingPhoto]);

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col overflow-hidden font-sans selection:bg-white/30">
      <AnimatePresence mode="wait">
        {view === 'studio' && (
          <motion.div
            key="studio"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Studio
              photos={photos}
              onOpenCamera={handleOpenCamera}
              onOpenPhoto={handleOpenPhoto}
              onImport={handleImport}
              onDelete={handleDeletePhoto}
            />
          </motion.div>
        )}
        
        {view === 'camera' && (
          <motion.div
            key="camera"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50"
          >
            <Camera
              onCapture={handleCapture}
              onClose={handleCloseCamera}
            />
          </motion.div>
        )}

        {view === 'editor' && editingPhoto && (
          <motion.div
            key="editor"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50"
          >
              <PhotoEditor
                imageSrc={editingPhoto.src}
                initialFilterId={editingPhoto.filterId}
                initialFilterIntensity={editingPhoto.filterIntensity ?? 100}
                initialAdjustments={editingPhoto.adjustments}
                onClose={handleCloseEditor}
                onSave={handleSaveEdit}
              />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
