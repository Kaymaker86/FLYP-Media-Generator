'use client';

import { type GenerationResult } from '@/lib/types';

interface ResultGalleryProps {
  result: GenerationResult | null;
  text?: string;
}

export default function ResultGallery({ result, text }: ResultGalleryProps) {
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
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Results</h3>

      {text && (
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-300 text-sm whitespace-pre-wrap">{text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.items.map((item, idx) => (
          <div key={idx} className="bg-gray-800 rounded-lg overflow-hidden">
            {item.type === 'image' && (
              <img
                src={item.url}
                alt={`Generated ${idx + 1}`}
                className="w-full h-auto"
              />
            )}
            {item.type === 'video' && (
              <video
                src={item.url}
                controls
                className="w-full"
                preload="metadata"
              />
            )}
            {item.type === 'audio' && (
              <div className="p-4">
                <audio src={item.url} controls className="w-full" preload="metadata" />
              </div>
            )}
            <div className="p-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">{item.filename}</span>
              <a
                href={item.url}
                download={item.filename}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
