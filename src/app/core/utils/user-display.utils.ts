import type { User } from '../models/user.model';

/** Derive registration-style first/last from stored user (supports legacy `name`-only rows). */
export function displayNameParts(user: User): { firstName: string; lastName: string } {
  const f = user.firstName?.trim();
  const l = user.lastName?.trim();
  if (f || l) return { firstName: f ?? '', lastName: l ?? '' };
  const parts = (user.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: '' };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(' ') };
}
