'use client';

import { type ModelDef, type ModelSetting } from '@/lib/modelRegistry';

interface SettingsPanelProps {
  model: ModelDef;
  settings: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
}

function SettingControl({
  setting,
  value,
  onChange,
}: {
  setting: ModelSetting;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}) {
  const currentValue = value ?? setting.default;

  switch (setting.type) {
    case 'select':
      return (
        <select
          value={String(currentValue)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {setting.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          type="number"
          value={Number(currentValue)}
          min={setting.min}
          max={setting.max}
          step={setting.step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );

    case 'toggle':
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(!currentValue)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              currentValue ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                currentValue ? 'translate-x-5' : ''
              }`}
            />
          </button>
          {setting.description && (
            <span className="text-xs text-gray-500">{setting.description}</span>
          )}
        </div>
      );

    case 'slider':
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            value={Number(currentValue)}
            min={setting.min}
            max={setting.max}
            step={setting.step || 1}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-gray-300 font-mono w-6 text-center">
            {Number(currentValue)}
          </span>
        </div>
      );

    case 'text':
      return (
        <input
          type="text"
          value={String(currentValue || '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-800 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );

    default:
      return null;
  }
}

export default function SettingsPanel({ model, settings, onChange }: SettingsPanelProps) {
  if (model.settings.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Settings</h3>
      {model.settings.map((setting) => (
        <div key={setting.key}>
          <label className="block text-sm text-gray-300 mb-1">{setting.label}</label>
          <SettingControl
            setting={setting}
            value={settings[setting.key]}
            onChange={(val) => onChange(setting.key, val)}
          />
          {setting.description && setting.type !== 'toggle' && (
            <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
