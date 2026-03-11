import { getGoogleClient } from './client';

interface TTSOptions {
  modelId: string;
  prompt: string;
  settings: Record<string, string | number | boolean>;
}

interface TTSResult {
  audio: { data: Buffer; mimeType: string };
}

export async function generateTTS(options: TTSOptions): Promise<TTSResult> {
  const client = getGoogleClient();
  const { modelId, prompt, settings } = options;

  const voiceName = (settings.voiceName as string) || 'Zephyr';
  const multiSpeaker = settings.multiSpeaker === true;

  const config: Record<string, unknown> = {
    responseModalities: ['AUDIO'],
  };

  if (multiSpeaker) {
    // Multi-speaker mode: parse "Speaker N:" prefixes from the prompt
    // The API uses multiSpeakerVoiceConfigs
    const speakerPattern = /Speaker\s+(\d+):/gi;
    const speakers = new Set<string>();
    let match;
    while ((match = speakerPattern.exec(prompt)) !== null) {
      speakers.add(match[1]);
    }

    if (speakers.size >= 2) {
      const voices = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede'];
      const speakerVoiceConfigs = Array.from(speakers).map((num, idx) => ({
        speaker: `Speaker ${num}`,
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voices[idx % voices.length],
          },
        },
      }));

      config.speechConfig = { multiSpeakerVoiceConfigs: speakerVoiceConfigs };
    }
  } else {
    config.speechConfig = {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName,
        },
      },
    };
  }

  const response = await client.models.generateContent({
    model: modelId,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config,
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const data = Buffer.from(part.inlineData.data!, 'base64');
        return {
          audio: {
            data,
            mimeType: part.inlineData.mimeType || 'audio/wav',
          },
        };
      }
    }
  }

  throw new Error('No audio data in TTS response');
}
