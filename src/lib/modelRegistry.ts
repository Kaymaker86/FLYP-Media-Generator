export type MediaType = 'image' | 'video' | 'audio' | 'music' | 'live';
export type InputType = 'text' | 'image' | 'image_url' | 'clipboard_image' | 'reference_image' | 'multi_image';
export type FlowType = 'immediate' | 'long_running' | 'realtime';
export type OutputType = 'image' | 'video' | 'audio';

export interface ModelSetting {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'toggle' | 'multi_speaker';
  options?: { value: string; label: string }[];
  default?: string | number | boolean;
  min?: number;
  max?: number;
  description?: string;
}

export interface ModelDef {
  id: string;
  displayName: string;
  description: string;
  mediaType: MediaType;
  acceptedInputs: InputType[];
  settings: ModelSetting[];
  outputType: OutputType;
  flowType: FlowType;
  enabled: boolean;
  maxImages?: number;
}

export const modelRegistry: ModelDef[] = [
  {
    id: 'gemini-3-pro-image-preview',
    displayName: 'Nano Banana Pro',
    description: 'Best quality image generation & editing',
    mediaType: 'image',
    acceptedInputs: ['text', 'image', 'image_url', 'clipboard_image', 'multi_image'],
    settings: [
      {
        key: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1 Square' },
          { value: '16:9', label: '16:9 Wide' },
          { value: '9:16', label: '9:16 Tall' },
          { value: '4:3', label: '4:3 Standard' },
          { value: '3:4', label: '3:4 Portrait' },
        ],
        default: '1:1',
      },
    ],
    outputType: 'image',
    flowType: 'immediate',
    enabled: true,
    maxImages: 5,
  },
  {
    id: 'gemini-3.1-flash-image-preview',
    displayName: 'Nano Banana 2',
    description: 'Fast image generation & editing',
    mediaType: 'image',
    acceptedInputs: ['text', 'image', 'image_url', 'clipboard_image', 'multi_image'],
    settings: [
      {
        key: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1 Square' },
          { value: '16:9', label: '16:9 Wide' },
          { value: '9:16', label: '9:16 Tall' },
          { value: '4:3', label: '4:3 Standard' },
          { value: '3:4', label: '3:4 Portrait' },
        ],
        default: '1:1',
      },
    ],
    outputType: 'image',
    flowType: 'immediate',
    enabled: true,
    maxImages: 5,
  },
  {
    id: 'gemini-2.5-flash-image',
    displayName: 'Nano Banana',
    description: 'Compatibility image model',
    mediaType: 'image',
    acceptedInputs: ['text', 'image', 'image_url', 'clipboard_image'],
    settings: [
      {
        key: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '1:1', label: '1:1 Square' },
          { value: '16:9', label: '16:9 Wide' },
          { value: '9:16', label: '9:16 Tall' },
          { value: '4:3', label: '4:3 Standard' },
          { value: '3:4', label: '3:4 Portrait' },
        ],
        default: '1:1',
      },
    ],
    outputType: 'image',
    flowType: 'immediate',
    enabled: true,
    maxImages: 1,
  },
  {
    id: 'veo-3.1-generate-preview',
    displayName: 'Veo 3.1',
    description: 'Cinematic video generation',
    mediaType: 'video',
    acceptedInputs: ['text', 'reference_image'],
    settings: [
      {
        key: 'aspectRatio',
        label: 'Aspect Ratio',
        type: 'select',
        options: [
          { value: '16:9', label: '16:9 Wide' },
          { value: '9:16', label: '9:16 Tall' },
        ],
        default: '16:9',
      },
      {
        key: 'durationSeconds',
        label: 'Duration (seconds)',
        type: 'number',
        min: 5,
        max: 8,
        default: 8,
      },
      {
        key: 'personGeneration',
        label: 'Person Generation',
        type: 'select',
        options: [
          { value: 'dont_allow', label: 'Not Allowed' },
          { value: 'allow_adult', label: 'Allow Adults' },
        ],
        default: 'dont_allow',
      },
    ],
    outputType: 'video',
    flowType: 'long_running',
    enabled: true,
  },
  {
    id: 'gemini-2.5-flash-preview-tts',
    displayName: 'Gemini 2.5 Flash TTS',
    description: 'Fast text-to-speech',
    mediaType: 'audio',
    acceptedInputs: ['text'],
    settings: [
      {
        key: 'voiceName',
        label: 'Voice',
        type: 'select',
        options: [
          { value: 'Zephyr', label: 'Zephyr' },
          { value: 'Puck', label: 'Puck' },
          { value: 'Charon', label: 'Charon' },
          { value: 'Kore', label: 'Kore' },
          { value: 'Fenrir', label: 'Fenrir' },
          { value: 'Leda', label: 'Leda' },
          { value: 'Orus', label: 'Orus' },
          { value: 'Aoede', label: 'Aoede' },
        ],
        default: 'Zephyr',
      },
      {
        key: 'multiSpeaker',
        label: 'Multi-Speaker Mode',
        type: 'toggle',
        default: false,
        description: 'Enable multiple speakers. Use Speaker 1:, Speaker 2: in your prompt.',
      },
    ],
    outputType: 'audio',
    flowType: 'immediate',
    enabled: true,
  },
  {
    id: 'gemini-2.5-pro-preview-tts',
    displayName: 'Gemini 2.5 Pro TTS',
    description: 'High quality text-to-speech',
    mediaType: 'audio',
    acceptedInputs: ['text'],
    settings: [
      {
        key: 'voiceName',
        label: 'Voice',
        type: 'select',
        options: [
          { value: 'Zephyr', label: 'Zephyr' },
          { value: 'Puck', label: 'Puck' },
          { value: 'Charon', label: 'Charon' },
          { value: 'Kore', label: 'Kore' },
          { value: 'Fenrir', label: 'Fenrir' },
          { value: 'Leda', label: 'Leda' },
          { value: 'Orus', label: 'Orus' },
          { value: 'Aoede', label: 'Aoede' },
        ],
        default: 'Zephyr',
      },
      {
        key: 'multiSpeaker',
        label: 'Multi-Speaker Mode',
        type: 'toggle',
        default: false,
        description: 'Enable multiple speakers. Use Speaker 1:, Speaker 2: in your prompt.',
      },
    ],
    outputType: 'audio',
    flowType: 'immediate',
    enabled: true,
  },
  {
    id: 'lyria-realtime-exp',
    displayName: 'Lyria Experimental',
    description: 'AI music generation (experimental)',
    mediaType: 'music',
    acceptedInputs: ['text'],
    settings: [],
    outputType: 'audio',
    flowType: 'realtime',
    enabled: false, // Feature flagged for v1
  },
];

export function getModel(id: string): ModelDef | undefined {
  return modelRegistry.find((m) => m.id === id);
}

export function getEnabledModels(): ModelDef[] {
  return modelRegistry.filter((m) => m.enabled);
}

export function getModelsByMediaType(mediaType: MediaType): ModelDef[] {
  return getEnabledModels().filter((m) => m.mediaType === mediaType);
}
