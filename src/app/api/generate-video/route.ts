import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { startVideoGeneration } from '@/lib/google/videoGenerator';
import { checkRateLimit } from '@/lib/rateLimit';
import { validatePrompt } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateCheck = checkRateLimit(`video-${ip}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil((rateCheck.retryAfterMs || 0) / 1000)}s` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { prompt, settings } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!validatePrompt(prompt)) {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    const result = await startVideoGeneration({
      prompt,
      settings: settings || {},
    });

    if (result.done && result.video) {
      // Video completed immediately (unlikely but handle it)
      const pathname = `generated/${uuidv4()}.mp4`;
      const blob = await put(pathname, result.video.data, {
        access: 'public',
        contentType: result.video.mimeType,
        addRandomSuffix: false,
      });

      return NextResponse.json({
        id: uuidv4(),
        status: 'complete',
        items: [{
          type: 'video',
          url: blob.url,
          mimeType: 'video/mp4',
          filename: 'generated-video.mp4',
        }],
      });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      id: uuidv4(),
      status: 'generating',
      operationName: result.operationName,
      items: [],
    });
  } catch (error) {
    console.error('Video generation error:', error);
    const message = error instanceof Error ? error.message : 'Video generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
