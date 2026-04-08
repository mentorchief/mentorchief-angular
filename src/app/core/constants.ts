/** App-wide constants. Single source for defaults used across the app. */

export const DEFAULT_SAMPLE_PRICE = 150;
export const RATING_SCALE_MAX = 5;
export const DEFAULT_MENTEE_CAPACITY = 5;
/** Upper bound for mentor mentee capacity (number input and validation). */
export const MENTEE_CAPACITY_MAX = 5;
export const DEFAULT_AVG_RATING = '4.8';

/**
 * Parse stored menteeCapacity to a numeric cap (spots, form defaults).
 * Supports positive integer strings; legacy bucket values ("2-3", "4-5", …).
 */
export function parseMenteeCapacity(c?: string | null): number {
  if (!c || typeof c !== 'string') return DEFAULT_MENTEE_CAPACITY;
  const t = c.trim();
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    if (Number.isInteger(n) && n >= 1) return Math.min(n, MENTEE_CAPACITY_MAX);
    return DEFAULT_MENTEE_CAPACITY;
  }
  if (t === '2-3') return Math.min(3, MENTEE_CAPACITY_MAX);
  if (t === '4-5') return Math.min(5, MENTEE_CAPACITY_MAX);
  if (t === '6-10') return Math.min(10, MENTEE_CAPACITY_MAX);
  if (t === '10+') return Math.min(15, MENTEE_CAPACITY_MAX);
  return DEFAULT_MENTEE_CAPACITY;
}
