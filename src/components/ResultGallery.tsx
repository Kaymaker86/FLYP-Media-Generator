'use client';

import { useState, useCallback } from 'react';
import { type GenerationResult, type GenerationResultItem } from '@/lib/types';

interface ResultGalleryProps {
  result: GenerationResult | null;
  text?: string;
}

function DownloadButton({ item }: { item: GenerationResultItem }) {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(item.url, '_blank');
    }
  }, [item]);

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
      </svg>
      Download
    </button>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: GenerationResultItem;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Download button */}
      <div className="absolute top-4 left-4 z-10">
        <DownloadButton item={item} />
      </div>

      {/* Content */}
      <div
        className="max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' && (
          <img
            src={item.url}
            alt="Generated fullscreen"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        )}
        {item.type === 'video' && (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        )}
        {item.type === 'audio' && (
          <div className="bg-gray-900 rounded-lg p-8 min-w-[300px]">
            <audio src={item.url} controls autoPlay className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultGallery({ result, text }: ResultGalleryProps) {
  const [lightboxItem, setLightboxItem] = useState<GenerationResultItem | null>(null);

  if (!result) return null;

  if (result.status === 'pending' || result.status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">
          {result.status === 'generating'
            ? 'Generating... This may take a moment.'
            : 'Starting generation...'}
        </p>
      </div>
    );
  }

  if (result.status === 'error') {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
        <p className="text-red-400 text-sm">{result.error || 'Generation failed'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Results ({result.items.length})
      </h3>

      {text && (
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.items.map((item, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg overflow-hidden group">
            {item.type === 'image' && (
              <div
                className="relative cursor-pointer"
                onClick={() => setLightboxItem(item)}
              >
                <img
                  src={item.url}
                  alt={`Generated ${idx + 1}`}
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white opacity-0 group-hover:opacity-80 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            )}
            {item.type === 'video' && (
              <div
                className="cursor-pointer"
                onClick={() => setLightboxItem(item)}
              >
                <video
                  src={item.url}
                  controls
                  className="w-full"
                  preload="metadata"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {item.type === 'audio' && (
              <div className="p-4">
                <audio src={item.url} controls className="w-full" preload="metadata" />
              </div>
            )}
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">{item.filename}</span>
              <DownloadButton item={item} />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </div>
  );
}
