'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import ModelPicker from '@/components/ModelPicker';
import SettingsPanel from '@/components/SettingsPanel';
import MediaUpload from '@/components/MediaUpload';
import ResultGallery from '@/components/ResultGallery';
import GenerateButton from '@/components/GenerateButton';
import { getEnabledModels, getModel, type ModelDef } from '@/lib/modelRegistry';
import { type AttachedMedia, type GenerationResult } from '@/lib/types';

interface GenerationTabProps {
  onModelChange: (model: ModelDef) => void;
  onSettingsSnapshot?: (modelId: string, settings: Record<string, string | number | boolean>) => void;
  onMediaSnapshot?: (media: AttachedMedia[]) => void;
  onPromptSnapshot?: (prompt: string) => void;
  initialModelId?: string;
  initialSettings?: Record<string, Record<string, string | number | boolean>>;
  initialMedia?: AttachedMedia[];
  initialPrompt?: string;
  initialResultUrl?: string;
  initialResultType?: 'image' | 'video' | 'audio';
}

export default function GenerationTab({ onModelChange, onSettingsSnapshot, onMediaSnapshot, onPromptSnapshot, initialModelId, initialSettings, initialMedia, initialPrompt, initialResultUrl, initialResultType }: GenerationTabProps) {
  const [selectedModel, setSelectedModel] = useState<ModelDef>(() => {
    if (initialModelId) {
      return getModel(initialModelId) || getEnabledModels()[0];
    }
    return getEnabledModels()[0];
  });
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [media, setMedia] = useState<AttachedMedia[]>(initialMedia || []);
  const [settings, setSettings] = useState<Record<string, Record<string, string | number | boolean>>>(
    initialSettings ? { ...initialSettings } : {}
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(() => {
    if (initialResultUrl && initialResultType) {
      return {
        id: 'history',
        status: 'complete',
        items: [{
          type: initialResultType,
          url: initialResultUrl,
          mimeType: initialResultType === 'image' ? 'image/png' : initialResultType === 'video' ? 'video/mp4' : 'audio/wav',
          filename: `reopened.${initialResultType === 'image' ? 'png' : initialResultType === 'video' ? 'mp4' : 'wav'}`,
        }],
      };
    }
    return null;
  });
  const [resultText, setResultText] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSettings = settings[selectedModel.id] || {};

  useEffect(() => {
    if (!settings[selectedModel.id]) {
      const defaults: Record<string, string | number | boolean> = {};
      selectedModel.settings.forEach((s) => {
        if (s.default !== undefined) defaults[s.key] = s.default;
      });
      setSettings((prev) => ({ ...prev, [selectedModel.id]: defaults }));
    }
  }, [selectedModel, settings]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Report settings back to parent for tab inheritance
  useEffect(() => {
    if (onSettingsSnapshot && currentSettings && Object.keys(currentSettings).length > 0) {
      onSettingsSnapshot(selectedModel.id, currentSettings);
    }
  }, [selectedModel.id, currentSettings, onSettingsSnapshot]);

  // Report media back to parent for tab inheritance
  useEffect(() => {
    if (onMediaSnapshot) {
      onMediaSnapshot(media);
    }
  }, [media, onMediaSnapshot]);

  // Report prompt back to parent for tab inheritance
  useEffect(() => {
    if (onPromptSnapshot) {
      onPromptSnapshot(prompt);
    }
  }, [prompt, onPromptSnapshot]);

  const handleSettingChange = useCallback(
    (key: string, value: string | number | boolean) => {
      setSettings((prev) => ({
        ...prev,
        [selectedModel.id]: { ...prev[selectedModel.id], [key]: value },
      }));
    },
    [selectedModel.id]
  );

  const handleAddMedia = useCallback((item: AttachedMedia) => {
    setMedia((prev) => {
      const existing = prev.findIndex((m) => m.id === item.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = item;
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const handleRemoveMedia = useCallback((id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleModelSelect = useCallback(
    (model: ModelDef) => {
      setSelectedModel(model);
      setMedia([]);
      setResult(null);
      setResultText(undefined);
      setSidebarOpen(false);
      onModelChange(model);
    },
    [onModelChange]
  );

  const pollOperation = useCallback((operationName: string, metadata?: Record<string, unknown>) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/poll-operation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName, metadata }),
        });
        const data = await res.json();

        if (data.done) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (data.error) {
            setResult({ id: '', status: 'error', items: [], error: data.error });
          } else if (data.result) {
            setResult(data.result);
          }
          setLoading(false);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setResult({ id: '', status: 'error', items: [], error: 'Polling failed' });
        setLoading(false);
      }
    }, 5000);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult({ id: '', status: 'pending', items: [] });
    setResultText(undefined);

    try {
      let endpoint: string;
      let body: Record<string, unknown>;

      switch (selectedModel.mediaType) {
        case 'image':
          endpoint = '/api/generate-image';
          body = { modelId: selectedModel.id, prompt, media, settings: currentSettings };
          break;
        case 'video':
          endpoint = '/api/generate-video';
          body = { prompt, media, settings: currentSettings };
          break;
        case 'audio':
          endpoint = '/api/generate-tts';
          body = { modelId: selectedModel.id, prompt, settings: currentSettings };
          break;
        default:
          throw new Error('Unsupported model type');
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ id: '', status: 'error', items: [], error: data.error });
        setLoading(false);
        return;
      }

      if (data.status === 'generating' && data.operationName) {
        setResult({ id: data.id, status: 'generating', items: [], operationName: data.operationName });
        pollOperation(data.operationName, {
          modelId: selectedModel.id,
          prompt,
          settings: currentSettings,
        });
      } else {
        setResult(data);
        if (data.text) setResultText(data.text);
        setLoading(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setResult({ id: '', status: 'error', items: [], error: message });
      setLoading(false);
    }
  }, [prompt, selectedModel, media, currentSettings, pollOperation]);

  const handleReset = useCallback(() => {
    setPrompt('');
    setMedia([]);
    setResult(null);
    setResultText(undefined);
    if (pollRef.current) clearInterval(pollRef.current);
    // Reset settings to defaults for current model
    const defaults: Record<string, string | number | boolean> = {};
    selectedModel.settings.forEach((s) => {
      if (s.default !== undefined) defaults[s.key] = s.default;
    });
    setSettings((prev) => ({ ...prev, [selectedModel.id]: defaults }));
  }, [selectedModel]);

  const promptPlaceholder =
    selectedModel.mediaType === 'audio'
      ? 'Enter text to speak...'
      : selectedModel.mediaType === 'video'
        ? 'Describe your video...'
        : 'Describe your image...';

  return (
    <div className="flex h-full">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-16 left-4 z-50 md:hidden bg-gray-800 p-2 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto transition-transform md:translate-x-0 shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ModelPicker selectedModelId={selectedModel.id} onSelect={handleModelSelect} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full overflow-y-auto">
        <div className="space-y-6">
          {/* Model info + reset */}
          <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{selectedModel.displayName}</h2>
              <p className="text-sm text-gray-400">{selectedModel.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white px-3 py-1.5 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors"
                title="Reset all settings, prompt, and results"
              >
                Reset
              </button>
            </div>
          </div>

          <SettingsPanel
            model={selectedModel}
            settings={currentSettings}
            onChange={handleSettingChange}
          />

          <MediaUpload
            model={selectedModel}
            media={media}
            onAdd={handleAddMedia}
            onRemove={handleRemoveMedia}
          />

          {/* Prompt */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!loading && prompt.trim()) {
                  handleGenerate();
                }
              }
            }}
            placeholder={promptPlaceholder}
            rows={4}
            className="w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
          />

          <GenerateButton
            onClick={handleGenerate}
            loading={loading}
            disabled={!prompt.trim()}
            label={
              selectedModel.mediaType === 'audio'
                ? 'Generate Speech'
                : selectedModel.mediaType === 'video'
                  ? 'Generate Video'
                  : 'Generate Image'
            }
          />

          <ResultGallery result={result} text={resultText} />
        </div>
      </main>
    </div>
  );
}
