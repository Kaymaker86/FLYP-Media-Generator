import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { pollVideoGeneration } from '@/lib/google/videoGenerator';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operationName, metadata } = body;

    if (!operationName) {
      return NextResponse.json({ error: 'operationName is required' }, { status: 400 });
    }

    const result = await pollVideoGeneration(operationName);

    if (!result.done) {
      return NextResponse.json({ done: false });
    }

    if (result.error) {
      return NextResponse.json({ done: true, error: result.error });
    }

    if (result.video) {
      const generationId = uuidv4();
      const pathname = `generated/${generationId}.mp4`;
      const blob = await put(pathname, result.video.data, {
        access: 'public',
        contentType: result.video.mimeType,
        addRandomSuffix: false,
      });

      // Store metadata if provided
      if (metadata) {
        await put(`generated/${generationId}.meta.json`, JSON.stringify({
          ...metadata,
          generatedAt: new Date().toISOString(),
        }), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false,
        });
      }

      return NextResponse.json({
        done: true,
        result: {
          id: generationId,
          status: 'complete',
          items: [
            {
              type: 'video',
              url: blob.url,
              mimeType: result.video.mimeType,
              filename: 'generated-video.mp4',
            },
          ],
        },
      });
    }

    return NextResponse.json({ done: true, error: 'No video generated' });
  } catch (error) {
    console.error('Poll operation error:', error);
    const message = error instanceof Error ? error.message : 'Polling failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
