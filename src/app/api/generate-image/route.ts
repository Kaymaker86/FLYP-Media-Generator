import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateImage } from '@/lib/google/imageGenerator';
import { getModel } from '@/lib/modelRegistry';
import { checkRateLimit } from '@/lib/rateLimit';
import { validatePrompt } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateCheck = checkRateLimit(`image-${ip}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil((rateCheck.retryAfterMs || 0) / 1000)}s` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { modelId, prompt, media, settings } = body;

    if (!modelId || !prompt) {
      return NextResponse.json({ error: 'Model and prompt are required' }, { status: 400 });
    }

    const model = getModel(modelId);
    if (!model || model.mediaType !== 'image') {
      return NextResponse.json({ error: 'Invalid image model' }, { status: 400 });
    }

    if (!validatePrompt(prompt)) {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    const result = await generateImage({
      modelId,
      prompt,
      media: media || [],
      settings: settings || {},
    });

    // Store generated images in Vercel Blob
    const items = await Promise.all(
      result.images.map(async (img, idx) => {
        const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
        const pathname = `generated/${uuidv4()}-${idx}.${ext}`;
        const blob = await put(pathname, img.data, {
          access: 'public',
          contentType: img.mimeType,
          addRandomSuffix: false,
        });
        return {
          type: 'image' as const,
          url: blob.url,
          mimeType: img.mimeType,
          filename: `generated-${idx + 1}.${ext}`,
        };
      })
    );

    return NextResponse.json({
      id: uuidv4(),
      status: 'complete',
      items,
      text: result.text,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
