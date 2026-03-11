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

async function generateSingle(
  modelId: string,
  parts: Part[],
  settings: Record<string, string | number | boolean>
): Promise<ImageGenResult> {
  const client = getGoogleClient();

  const config: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };

  // Image config
  if (settings.aspectRatio) config.aspectRatio = settings.aspectRatio;
  if (settings.personGeneration) config.personGeneration = settings.personGeneration;
  if (settings.outputMimeType) config.outputMimeType = settings.outputMimeType;
  if (settings.outputCompressionQuality) {
    config.outputCompressionQuality = Number(settings.outputCompressionQuality);
  }
  if (settings.imageSize) config.imageSize = settings.imageSize;

  // General settings
  if (settings.temperature !== undefined && settings.temperature !== '' && Number(settings.temperature) !== 1) {
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

  if (response.candidates?.[0]?.content?.parts) {
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

export async function generateImage(options: ImageGenOptions): Promise<ImageGenResult> {
  const { modelId, prompt, media, settings } = options;

  // Build parts
  const parts: Part[] = [];
  for (const m of media) {
    parts.push(await mediaToInlinePart(m));
  }
  parts.push({ text: prompt });

  const numberOfImages = Math.min(4, Math.max(1, Number(settings.numberOfImages) || 1));

  if (numberOfImages === 1) {
    return generateSingle(modelId, parts, settings);
  }

  // Parallel calls for multiple images
  const responses = await Promise.allSettled(
    Array.from({ length: numberOfImages }, () =>
      generateSingle(modelId, parts, settings)
    )
  );

  const combined: ImageGenResult = { images: [] };
  for (const res of responses) {
    if (res.status === 'fulfilled') {
      combined.images.push(...res.value.images);
      if (res.value.text && !combined.text) {
        combined.text = res.value.text;
      }
    }
  }

  return combined;
}
