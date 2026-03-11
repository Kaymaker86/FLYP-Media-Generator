import { getGoogleClient } from './client';
import { buildSafetySettings } from './safetySettings';
import { AttachedMedia } from '../types';
import { type Part } from '@google/genai';

interface ImageGenOptions {
  modelId: string;
  prompt: string;
  media: AttachedMedia[];
  settings: Record<string, string | number | boolean>;
}

interface ImageGenResult {
  images: { data: Buffer; mimeType: string }[];
  text?: string;
}

async function mediaToInlinePart(media: AttachedMedia): Promise<Part> {
  const url = media.blobUrl || media.previewUrl;
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return {
    inlineData: {
      data: base64,
      mimeType: media.mimeType,
    },
  };
}

export async function generateImage(options: ImageGenOptions): Promise<ImageGenResult> {
  const client = getGoogleClient();
  const { modelId, prompt, media, settings } = options;

  // Build parts
  const parts: Part[] = [];

  for (const m of media) {
    parts.push(await mediaToInlinePart(m));
  }

  parts.push({ text: prompt });

  // Build generation config
  const config: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };

  // Image-specific config (nested under imageConfig)
  const imageConfig: Record<string, unknown> = {};

  if (settings.aspectRatio) imageConfig.aspectRatio = settings.aspectRatio;
  if (settings.imageSize) imageConfig.imageSize = settings.imageSize;
  if (settings.outputMimeType) imageConfig.outputMimeType = settings.outputMimeType;
  if (settings.outputCompressionQuality) {
    imageConfig.outputCompressionQuality = Number(settings.outputCompressionQuality);
  }
  if (settings.personGeneration) imageConfig.personGeneration = settings.personGeneration;

  if (Object.keys(imageConfig).length > 0) {
    config.imageConfig = imageConfig;
  }

  // General generation settings
  if (settings.temperature !== undefined && settings.temperature !== '') {
    config.temperature = Number(settings.temperature);
  }

  // Safety settings
  config.safetySettings = buildSafetySettings(settings.safetyTolerance);

  const response = await client.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts }],
    config,
  });

  const result: ImageGenResult = { images: [] };

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const data = Buffer.from(part.inlineData.data!, 'base64');
        result.images.push({ data, mimeType: part.inlineData.mimeType || 'image/png' });
      } else if (part.text) {
        result.text = part.text;
      }
    }
  }

  return result;
}
