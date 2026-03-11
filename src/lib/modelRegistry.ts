export type MediaType = 'image' | 'video' | 'audio' | 'music' | 'live';
export type InputType = 'text' | 'image' | 'image_url' | 'clipboard_image' | 'reference_image' | 'multi_image';
export type FlowType = 'immediate' | 'long_running' | 'realtime';
export type OutputType = 'image' | 'video' | 'audio';

export interface ModelSetting {
  key: string;
  label: string;
  type: 'select' | 'number' | 'text' | 'toggle' | 'slider' | 'multi_speaker';
  options?: { value: string; label: string }[];
  default?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
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

// ── Shared setting fragments ──────────────────────────────────────

const imageAspectRatio: ModelSetting = {
  key: 'aspectRatio',
  label: 'Aspect Ratio',
  type: 'select',
  options: [
    { value: '1:1', label: '1:1 Square' },
    { value: '16:9', label: '16:9 Wide' },
    { value: '9:16', label: '9:16 Tall' },
    { value: '4:3', label: '4:3 Standard' },
    { value: '3:4', label: '3:4 Portrait' },
    { value: '3:2', label: '3:2 Landscape' },
    { value: '2:3', label: '2:3 Portrait' },
    { value: '21:9', label: '21:9 Ultra Wide' },
  ],
  default: '1:1',
};

const imageSize: ModelSetting = {
  key: 'imageSize',
  label: 'Image Size',
  type: 'select',
  options: [
    { value: '1K', label: '1K (Default)' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ],
  default: '1K',
  description: 'Output image resolution',
};

const imageOutputFormat: ModelSetting = {
  key: 'outputMimeType',
  label: 'Output Format',
  type: 'select',
  options: [
    { value: 'image/png', label: 'PNG' },
    { value: 'image/jpeg', label: 'JPEG' },
    { value: 'image/webp', label: 'WebP' },
  ],
  default: 'image/png',
};

const imageCompressionQuality: ModelSetting = {
  key: 'outputCompressionQuality',
  label: 'JPEG Quality',
  type: 'number',
  min: 1,
  max: 100,
  default: 85,
  description: 'Compression quality (only applies to JPEG output)',
};

const imagePersonGeneration: ModelSetting = {
  key: 'personGeneration',
  label: 'Person Generation',
  type: 'select',
  options: [
    { value: 'ALLOW_ALL', label: 'Allow All' },
    { value: 'ALLOW_ADULT', label: 'Allow Adults Only' },
    { value: 'ALLOW_NONE', label: 'Not Allowed' },
  ],
  default: 'ALLOW_ALL',
};

const imageTemperature: ModelSetting = {
  key: 'temperature',
  label: 'Temperature',
  type: 'number',
  min: 0,
  max: 2,
  step: 0.1,
  default: 1,
  description: 'Controls randomness. Lower = more deterministic.',
};

const ttsVoice: ModelSetting = {
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
};

const ttsMultiSpeaker: ModelSetting = {
  key: 'multiSpeaker',
  label: 'Multi-Speaker Mode',
  type: 'toggle',
  default: false,
  description: 'Enable multiple speakers. Use Speaker 1:, Speaker 2: in your prompt.',
};

const ttsLanguage: ModelSetting = {
  key: 'languageCode',
  label: 'Language',
  type: 'select',
  options: [
    { value: '', label: 'Auto-detect' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'zh', label: 'Chinese' },
    { value: 'hi', label: 'Hindi' },
    { value: 'ar', label: 'Arabic' },
    { value: 'ru', label: 'Russian' },
  ],
  default: '',
};

const numberOfImages: ModelSetting = {
  key: 'numberOfImages',
  label: 'Number of Images',
  type: 'slider',
  min: 1,
  max: 4,
  step: 1,
  default: 1,
  description: 'How many images to generate per request',
};

const safetyTolerance: ModelSetting = {
  key: 'safetyTolerance',
  label: 'Safety Tolerance',
  type: 'select',
  options: [
    { value: '1', label: '1 — Strictest' },
    { value: '2', label: '2 — Strict' },
    { value: '3', label: '3 — Moderate' },
    { value: '4', label: '4 — Relaxed' },
    { value: '5', label: '5 — Permissive' },
    { value: '6', label: '6 — Least restrictive' },
  ],
  default: '3',
  description: 'Controls how aggressively content is filtered (1 = most restrictive, 6 = least)',
};

// ── Model registry ────────────────────────────────────────────────

export const modelRegistry: ModelDef[] = [
  // ── Image Models ──
  {
    id: 'gemini-3-pro-image-preview',
    displayName: 'Nano Banana Pro',
    description: 'Best quality image generation & editing',
    mediaType: 'image',
    acceptedInputs: ['text', 'image', 'image_url', 'clipboard_image', 'multi_image'],
    settings: [
      numberOfImages,
      imageAspectRatio,
      imageSize,
      imageOutputFormat,
      imageCompressionQuality,
      imagePersonGeneration,
      imageTemperature,
      safetyTolerance,
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
      numberOfImages,
      imageAspectRatio,
      imageSize,
      imageOutputFormat,
      imageCompressionQuality,
      imagePersonGeneration,
      imageTemperature,
      safetyTolerance,
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
      numberOfImages,
      imageAspectRatio,
      imageOutputFormat,
      imageCompressionQuality,
      imagePersonGeneration,
      imageTemperature,
      safetyTolerance,
    ],
    outputType: 'image',
    flowType: 'immediate',
    enabled: true,
    maxImages: 4,
  },

  // ── Video Model ──
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
          { value: '16:9', label: '16:9 Landscape' },
          { value: '9:16', label: '9:16 Portrait' },
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
        key: 'resolution',
        label: 'Resolution',
        type: 'select',
        options: [
          { value: '720p', label: '720p' },
          { value: '1080p', label: '1080p' },
        ],
        default: '720p',
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
      {
        key: 'generateAudio',
        label: 'Generate Audio',
        type: 'toggle',
        default: true,
        description: 'Generate audio alongside the video',
      },
      {
        key: 'enhancePrompt',
        label: 'Enhance Prompt',
        type: 'toggle',
        default: false,
        description: 'Use AI to rewrite and improve your prompt',
      },
      {
        key: 'negativePrompt',
        label: 'Negative Prompt',
        type: 'text',
        default: '',
        description: 'Describe what to exclude from the video',
      },
      {
        key: 'numberOfVideos',
        label: 'Number of Videos',
        type: 'slider',
        min: 1,
        max: 4,
        step: 1,
        default: 1,
      },
      {
        key: 'seed',
        label: 'Seed',
        type: 'number',
        min: 0,
        max: 2147483647,
        default: 0,
        description: 'Set to a fixed value for reproducible results (0 = random)',
      },
      {
        key: 'compressionQuality',
        label: 'Compression',
        type: 'select',
        options: [
          { value: 'OPTIMIZED', label: 'Optimized (smaller file)' },
          { value: 'LOSSLESS', label: 'Lossless (larger file)' },
        ],
        default: 'OPTIMIZED',
      },
      safetyTolerance,
    ],
    outputType: 'video',
    flowType: 'long_running',
    enabled: true,
  },

  // ── TTS Models ──
  {
    id: 'gemini-2.5-flash-preview-tts',
    displayName: 'Gemini 2.5 Flash TTS',
    description: 'Fast text-to-speech',
    mediaType: 'audio',
    acceptedInputs: ['text'],
    settings: [ttsVoice, ttsMultiSpeaker, ttsLanguage, safetyTolerance],
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
    settings: [ttsVoice, ttsMultiSpeaker, ttsLanguage, safetyTolerance],
    outputType: 'audio',
    flowType: 'immediate',
    enabled: true,
  },

  // ── Music Model ──
  {
    id: 'lyria-realtime-exp',
    displayName: 'Lyria Experimental',
    description: 'AI music generation (experimental)',
    mediaType: 'music',
    acceptedInputs: ['text'],
    settings: [],
    outputType: 'audio',
    flowType: 'realtime',
    enabled: false,
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
