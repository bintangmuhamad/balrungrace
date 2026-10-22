/**
 * Cryptographically secure random number utilities using window.crypto
 */

export function getSecureRandomFloat(): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

export function getSecureRandomInt(min: number, max: number): number {
  // min and max inclusive
  const range = max - min + 1;
  const maxSafe = Math.floor(0xffffffff / range) * range;
  const array = new Uint32Array(1);
  let value: number;
  do {
    window.crypto.getRandomValues(array);
    value = array[0];
  } while (value >= maxSafe);
  return min + (value % range);
}

/**
 * Cryptographically fair Fisher-Yates shuffle
 */
export function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick a pure random winner index from array
 */
export function pickRandomWinnerIndex(total: number): number {
  if (total <= 0) return -1;
  return getSecureRandomInt(0, total - 1);
}

// Harmonious character color palettes (vibrant, cheerful)
export const CHARACTER_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
];

export const HEADBAND_COLORS = [
  '#ef4444', // Merah (khas 17-an)
  '#ffffff', // Putih
  '#f59e0b', // Kuning Emas
  '#10b981', // Hijau
  '#3b82f6', // Biru
  '#8b5cf6', // Ungu
];
