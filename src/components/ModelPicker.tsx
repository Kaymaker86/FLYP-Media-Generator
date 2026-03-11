'use client';

import { getEnabledModels, type ModelDef, type MediaType } from '@/lib/modelRegistry';

const mediaTypeLabels: Record<MediaType, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Speech',
  music: 'Music',
  live: 'Live',
};

interface ModelPickerProps {
  selectedModelId: string;
  onSelect: (model: ModelDef) => void;
}

export default function ModelPicker({ selectedModelId, onSelect }: ModelPickerProps) {
  const models = getEnabledModels();

  // Group by media type
  const grouped = models.reduce(
    (acc, model) => {
      if (!acc[model.mediaType]) acc[model.mediaType] = [];
      acc[model.mediaType].push(model);
      return acc;
    },
    {} as Record<MediaType, ModelDef[]>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Models</h2>
      {Object.entries(grouped).map(([mediaType, models]) => (
        <div key={mediaType}>
          <h3 className="text-xs font-medium text-gray-500 mb-2">
            {mediaTypeLabels[mediaType as MediaType]}
          </h3>
          <div className="space-y-1">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => onSelect(model)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedModelId === model.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="font-medium text-sm">{model.displayName}</div>
                <div
                  className={`text-xs ${selectedModelId === model.id ? 'text-blue-200' : 'text-gray-500'}`}
                >
                  {model.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
