/**
 * Maps a 1–6 safety tolerance level to Google API HarmBlockThreshold safety settings.
 *
 * 1 = Strictest (BLOCK_LOW_AND_ABOVE)
 * 2 = Strict (BLOCK_MEDIUM_AND_ABOVE for most, LOW for sexual)
 * 3 = Moderate (BLOCK_MEDIUM_AND_ABOVE)
 * 4 = Relaxed (BLOCK_ONLY_HIGH)
 * 5 = Permissive (BLOCK_ONLY_HIGH, looser on some categories)
 * 6 = Least restrictive (BLOCK_NONE / OFF)
 */

const HARM_CATEGORIES = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
] as const;

type Threshold =
  | 'BLOCK_LOW_AND_ABOVE'
  | 'BLOCK_MEDIUM_AND_ABOVE'
  | 'BLOCK_ONLY_HIGH'
  | 'BLOCK_NONE'
  | 'OFF';

const TOLERANCE_MAP: Record<number, Threshold> = {
  1: 'BLOCK_LOW_AND_ABOVE',
  2: 'BLOCK_MEDIUM_AND_ABOVE',
  3: 'BLOCK_MEDIUM_AND_ABOVE',
  4: 'BLOCK_ONLY_HIGH',
  5: 'BLOCK_NONE',
  6: 'OFF',
};

export function buildSafetySettings(toleranceLevel: number | string | boolean | undefined) {
  const level = Math.min(6, Math.max(1, Number(toleranceLevel) || 3));
  const threshold = TOLERANCE_MAP[level];

  return HARM_CATEGORIES.map((category) => ({
    category,
    threshold,
  }));
}
