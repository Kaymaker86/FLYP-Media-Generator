'use client';

import { useCallback, useRef, useState } from 'react';
import { type AttachedMedia } from '@/lib/types';
import { type ModelDef } from '@/lib/modelRegistry';
import { v4 as uuidv4 } from 'uuid';

interface MediaUploadProps {
  model: ModelDef;
  media: AttachedMedia[];
  onAdd: (media: AttachedMedia) => void;
  onRemove: (id: string) => void;
}

export default function MediaUpload({ model, media, onAdd, onRemove }: MediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const acceptsImages = model.acceptedInputs.some((i) =>
    ['image', 'image_url', 'clipboard_image', 'reference_image', 'multi_image'].includes(i)
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const id = uuidv4();
      const previewUrl = URL.createObjectURL(file);

      // Add immediately for preview
      const mediaItem: AttachedMedia = {
        id,
        type: 'file',
        filename: file.name,
        mimeType: file.type,
        previewUrl,
        size: file.size,
      };
      onAdd(mediaItem);

      // Upload to Vercel Blob
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
        const data = await res.json();
        // Update with blob URL - we do this via onAdd with same id
        onAdd({ ...mediaItem, blobUrl: data.url });
      } catch (err) {
        console.error('Upload failed:', err);
        onRemove(id);
      } finally {
        setUploading(false);
      }
    },
    [onAdd, onRemove]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      files.forEach(uploadFile);
    },
    [uploadFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) uploadFile(file);
        }
      }
    },
    [uploadFile]
  );

  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) return;
    const id = uuidv4();
    const mediaItem: AttachedMedia = {
      id,
      type: 'url',
      filename: urlInput.split('/').pop() || 'image',
      mimeType: 'image/jpeg',
      previewUrl: urlInput.trim(),
      blobUrl: urlInput.trim(),
    };
    onAdd(mediaItem);
    setUrlInput('');
  }, [urlInput, onAdd]);

  if (!acceptsImages) return null;

  const maxImages = model.maxImages || 1;
  const canAddMore = media.length < maxImages;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Input Media {maxImages > 1 && `(${media.length}/${maxImages})`}
      </h3>

      {/* Thumbnail strip */}
      {media.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {media.map((m) => (
            <div key={m.id} className="relative group">
              <img
                src={m.previewUrl}
                alt={m.filename}
                className="w-20 h-20 object-cover rounded-lg border border-gray-700"
              />
              <button
                onClick={() => onRemove(m.id)}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                x
              </button>
              {!m.blobUrl && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <>
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onPaste={handlePaste}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <p className="text-sm text-gray-400">
              {uploading ? 'Uploading...' : 'Drop images, paste from clipboard, or click to browse'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple={maxImages > 1}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(uploadFile);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>

          {/* URL import */}
          {model.acceptedInputs.includes('image_url') && (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
                placeholder="Paste image URL..."
                className="flex-1 bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUrlImport}
                disabled={!urlInput.trim()}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
