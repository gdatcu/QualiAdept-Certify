'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (dataUrl: string) => void;
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
}: SignaturePadModalProps) {
  const t = useTranslations('Trainer');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(2.5);

  // Fetch current signature on mount or open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/trainer/signature')
        .then((res) => res.json())
        .then((data) => {
          if (data.signatureUrl) {
            setSavedSignature(data.signatureUrl);
          }
        })
        .catch((err) => console.error('Error fetching signature:', err));
    }
  }, [isOpen]);

  // Setup canvas resolution and coordinate scaling
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina scale
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
  }, [strokeColor, strokeWidth]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(setupCanvas, 50);
    }
  }, [isOpen, setupCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;

    try {
      setIsSaving(true);
      const dataUrl = canvas.toDataURL('image/png');

      const res = await fetch('/api/trainer/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      });

      if (!res.ok) {
        throw new Error('Failed to save signature');
      }

      setSavedSignature(dataUrl);
      if (onSave) onSave(dataUrl);
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      alert('Could not save signature. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold">
              ✍️
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Semnătură Trainer &amp; Certificate
              </h3>
              <p className="text-xs text-slate-400">
                Desenează semnătura oficială care va fi aplicată pe certificatele de competență.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Saved Signature Preview if exists */}
          {savedSignature && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">
                  Semnătura Salvată Curentă:
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                  Activă pe certificate
                </span>
              </div>
              <div className="flex justify-center bg-white/95 rounded-lg py-2 px-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={savedSignature}
                  alt="Saved signature"
                  className="h-12 object-contain filter"
                />
              </div>
            </div>
          )}

          {/* Drawing Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                {savedSignature ? 'Desenează o nouă semnătură:' : 'Desenează semnătura:'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrokeColor('#0f172a')}
                  className={`h-4 w-4 rounded-full border ${strokeColor === '#0f172a' ? 'ring-2 ring-emerald-500' : ''} bg-slate-900`}
                  title="Navy / Black"
                />
                <button
                  type="button"
                  onClick={() => setStrokeColor('#0284c7')}
                  className={`h-4 w-4 rounded-full border ${strokeColor === '#0284c7' ? 'ring-2 ring-emerald-500' : ''} bg-sky-600`}
                  title="Royal Blue"
                />
                <button
                  type="button"
                  onClick={() => setStrokeWidth(strokeWidth === 2.5 ? 4 : 2.5)}
                  className="text-[11px] text-slate-400 hover:text-slate-200"
                >
                  {strokeWidth === 2.5 ? 'Grosime: Fin' : 'Grosime: Mediu'}
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border-2 border-dashed border-slate-700 bg-white/95 p-1 touch-none">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="h-36 w-full cursor-crosshair rounded-lg"
              />
              {!hasContent && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400/80 italic">
                  Semnează aici cu mouse-ul, degetul sau stylus-ul...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-6 py-4">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={!hasContent}
            className="rounded-lg border border-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            Șterge / Clear
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
            >
              Închide
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasContent || isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none transition"
            >
              {isSaving ? 'Se salvează...' : 'Salvează Semnătura'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
