export interface AttachedMedia {
  id: string;
  type: 'file' | 'url';
  filename: string;
  mimeType: string;
  previewUrl: string; // local object URL or remote URL for preview
  blobUrl?: string; // Vercel Blob URL after upload
  size?: number;
}

export interface GenerationRequest {
  modelId: string;
  prompt: string;
  media: AttachedMedia[];
  settings: Record<string, string | number | boolean>;
}

export interface GenerationResultItem {
  type: 'image' | 'video' | 'audio';
  url: string; // Vercel Blob URL
  mimeType: string;
  filename: string;
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  items: GenerationResultItem[];
  error?: string;
  operationName?: string; // For long-running ops (Veo)
}

export interface UploadResponse {
  url: string;
  pathname: string;
}

export interface PollResponse {
  done: boolean;
  result?: GenerationResult;
  error?: string;
}
