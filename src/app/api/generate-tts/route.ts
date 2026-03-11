import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateTTS } from '@/lib/google/ttsGenerator';
import { getModel } from '@/lib/modelRegistry';
import { checkRateLimit } from '@/lib/rateLimit';
import { validatePrompt } from '@/lib/validation';
import { v4 as uuidv4 } from 'uuid';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateCheck = checkRateLimit(`tts-${ip}`);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limited. Try again in ${Math.ceil((rateCheck.retryAfterMs || 0) / 1000)}s` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { modelId, prompt, settings } = body;

    if (!modelId || !prompt) {
      return NextResponse.json({ error: 'Model and prompt are required' }, { status: 400 });
    }

    const model = getModel(modelId);
    if (!model || model.mediaType !== 'audio') {
      return NextResponse.json({ error: 'Invalid TTS model' }, { status: 400 });
    }

    if (!validatePrompt(prompt)) {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 });
    }

    const result = await generateTTS({
      modelId,
      prompt,
      settings: settings || {},
    });

    // Store audio in Vercel Blob
    const ext = result.audio.mimeType.includes('wav') ? 'wav' : 'mp3';
    const pathname = `generated/${uuidv4()}.${ext}`;
    const blob = await put(pathname, result.audio.data, {
      access: 'public',
      contentType: result.audio.mimeType,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      id: uuidv4(),
      status: 'complete',
      items: [
        {
          type: 'audio',
          url: blob.url,
          mimeType: result.audio.mimeType,
          filename: `generated-speech.${ext}`,
        },
      ],
    });
  } catch (error) {
    console.error('TTS generation error:', error);
    const message = error instanceof Error ? error.message : 'TTS generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
