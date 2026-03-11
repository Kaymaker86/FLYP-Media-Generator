import { getGoogleClient } from './client';
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

  // Add image parts first
  for (const m of media) {
    parts.push(await mediaToInlinePart(m));
  }

  // Add text prompt
  parts.push({ text: prompt });

  // Build generation config
  const config: Record<string, unknown> = {
    responseModalities: ['TEXT', 'IMAGE'],
  };

  if (settings.aspectRatio) {
    config.aspectRatio = settings.aspectRatio;
  }

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
