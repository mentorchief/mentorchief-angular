import { DEFAULT_MENTEE_CAPACITY } from '../constants';

/** Parse menteeCapacity string (e.g. "2-3", "6-10") to max capacity number. */
export function parseMenteeCapacity(c?: string): number {
  if (!c) return DEFAULT_MENTEE_CAPACITY;
  if (c === '1') return 1;
  if (c === '2-3') return 3;
  if (c === '4-5') return 5;
  if (c === '6-10') return 10;
  if (c === '10+') return 15;
  return DEFAULT_MENTEE_CAPACITY;
}
