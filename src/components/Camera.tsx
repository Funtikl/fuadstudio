import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FlipHorizontal, X } from 'lucide-react';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please allow permissions.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white p-4 text-center z-10 bg-black/80">
          <p>{error}</p>
        </div>
      )}
      
      <div className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-start z-10 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button onClick={onClose} className="p-2.5 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10">
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[#030303]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ 
            transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
          }}
        />
        {/* Subtle grid overlay for composition */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-20">
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-r border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-r border-white" />
          <div className="border-r border-white" />
          <div className="" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center pb-8 z-10">
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-[3px] border-white/80 p-1.5 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] mx-auto"
        >
          <div className="w-full h-full bg-white rounded-full shadow-inner" />
        </button>

        <button
          onClick={toggleCamera}
          className="absolute right-10 p-4 text-white/60 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10"
        >
          <FlipHorizontal className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
