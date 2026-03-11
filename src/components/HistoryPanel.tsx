'use client';

import { useState, useEffect, useCallback } from 'react';

interface HistoryItem {
  url: string;
  pathname: string;
  contentType: string;
  uploadedAt: string;
  size: number;
  metadataUrl?: string;
}

interface GenerationMetadata {
  modelId: string;
  prompt: string;
  settings: Record<string, string | number | boolean>;
  media?: { id: string; type: string; filename: string; mimeType: string; previewUrl: string; blobUrl?: string }[];
  generatedAt: string;
}

interface LightboxState {
  url: string;
  type: 'image' | 'video' | 'audio';
  filename: string;
}

function getMediaType(contentType: string): 'image' | 'video' | 'audio' {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  if (contentType.startsWith('audio/')) return 'audio';
  return 'image';
}

function getFilename(pathname: string): string {
  return pathname.split('/').pop() || pathname;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, '_blank');
    }
  }, [url, filename]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleDownload();
      }}
      className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-medium transition-colors"
      title="Download"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
      </svg>
    </button>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: LightboxState;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className="max-w-full max-h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' && (
          <img src={item.url} alt="History item fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        )}
        {item.type === 'video' && (
          <video src={item.url} controls autoPlay className="max-w-full max-h-[90vh] rounded-lg" />
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

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenInTab?: (metadata: GenerationMetadata, resultUrl: string, resultType: 'image' | 'video' | 'audio') => void;
}

export default function HistoryPanel({ open, onClose, onOpenInTab }: HistoryPanelProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<LightboxState | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      fetch('/api/history')
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setItems(data.items || []);
          }
        })
        .catch(() => setError('Failed to load history'))
        .finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !lightboxItem) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose, lightboxItem]);

  const handleOpenInTab = useCallback(async (item: HistoryItem) => {
    if (!item.metadataUrl || !onOpenInTab) return;
    try {
      const res = await fetch(item.metadataUrl);
      const metadata: GenerationMetadata = await res.json();
      const mediaType = getMediaType(item.contentType);
      onOpenInTab(metadata, item.url, mediaType);
      onClose();
    } catch {
      // Metadata fetch failed, can't reopen
    }
  }, [onOpenInTab, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-12">No generated assets yet.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item) => {
                const mediaType = getMediaType(item.contentType);
                const filename = getFilename(item.pathname);

                return (
                  <div
                    key={item.pathname}
                    className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() =>
                      setLightboxItem({ url: item.url, type: mediaType, filename })
                    }
                  >
                    {mediaType === 'image' ? (
                      <div className="aspect-square relative overflow-hidden">
                        <img src={item.url} alt={filename} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center bg-gray-800">
                        {mediaType === 'video' ? (
                          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        )}
                      </div>
                    )}

                    <div className="p-2 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs text-gray-400 truncate flex-1">{filename}</span>
                        <div className="flex gap-1 shrink-0">
                          {item.metadataUrl && onOpenInTab && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenInTab(item);
                              }}
                              className="flex items-center text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded font-medium transition-colors"
                              title="Open in new tab with same settings"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          <DownloadButton url={item.url} filename={filename} />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{formatDate(item.uploadedAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}
    </>
  );
}

export type { GenerationMetadata };
