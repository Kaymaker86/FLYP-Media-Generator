import { getGoogleClient } from './client';
import { type GenerateVideosOperation } from '@google/genai';

interface VideoGenOptions {
  prompt: string;
  settings: Record<string, string | number | boolean>;
}

interface VideoGenResult {
  done: boolean;
  operationName?: string;
  video?: { data: Buffer; mimeType: string };
  error?: string;
}

// In-memory store for pending operations (keyed by operation name)
const pendingOps = new Map<string, GenerateVideosOperation>();

export async function startVideoGeneration(options: VideoGenOptions): Promise<VideoGenResult> {
  const client = getGoogleClient();
  const { prompt, settings } = options;

  const config: Record<string, unknown> = {};
  if (settings.aspectRatio) config.aspectRatio = settings.aspectRatio;
  if (settings.durationSeconds) config.durationSeconds = Number(settings.durationSeconds);
  if (settings.personGeneration) config.personGeneration = settings.personGeneration;

  const operation = await client.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt,
    config,
  });

  if (operation.done) {
    return await extractVideo(operation);
  }

  // Store the operation object for polling
  const opName = operation.name || `op-${Date.now()}`;
  pendingOps.set(opName, operation);

  return { done: false, operationName: opName };
}

export async function pollVideoGeneration(operationName: string): Promise<VideoGenResult> {
  const client = getGoogleClient();
  const pendingOp = pendingOps.get(operationName);

  if (!pendingOp) {
    return { done: true, error: 'Operation not found. It may have expired.' };
  }

  const operation = await client.operations.getVideosOperation({
    operation: pendingOp,
  });

  if (!operation.done) {
    // Update stored operation
    pendingOps.set(operationName, operation);
    return { done: false };
  }

  // Clean up
  pendingOps.delete(operationName);
  return await extractVideo(operation);
}

async function extractVideo(operation: GenerateVideosOperation): Promise<VideoGenResult> {
  if (operation.error) {
    const errorMsg =
      typeof operation.error === 'object' && 'message' in operation.error
        ? String(operation.error.message)
        : 'Video generation failed';
    return { done: true, error: errorMsg };
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (videoUri) {
    const videoResponse = await fetch(videoUri);
    const arrayBuffer = await videoResponse.arrayBuffer();
    return {
      done: true,
      video: {
        data: Buffer.from(arrayBuffer),
        mimeType: 'video/mp4',
      },
    };
  }

  return { done: true, error: 'No video in response' };
}
