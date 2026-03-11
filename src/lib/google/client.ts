import { GoogleGenAI } from '@google/genai';

let _client: GoogleGenAI | null = null;

export function getGoogleClient(): GoogleGenAI {
  if (_client) return _client;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }
  _client = new GoogleGenAI({ apiKey });
  return _client;
}
