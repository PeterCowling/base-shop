export const PRIME_GUEST_SESSION_KEYS = [
  'prime_guest_token',
  'prime_guest_booking_id',
  'prime_guest_uuid',
  'prime_guest_first_name',
  'prime_guest_verified_at',
] as const;

export type GuestSessionStorageKey = (typeof PRIME_GUEST_SESSION_KEYS)[number];

export interface GuestSessionSnapshot {
  token: string | null;
  bookingId: string | null;
  uuid: string | null;
  firstName: string | null;
  verifiedAt: string | null;
}

export type TokenValidationResult = 'valid' | 'expired' | 'invalid' | 'network_error';

function toTrimmed(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

export function readGuestSession(storage: Pick<Storage, 'getItem'> = localStorage): GuestSessionSnapshot {
  return {
    token: toTrimmed(storage.getItem('prime_guest_token')),
    bookingId: toTrimmed(storage.getItem('prime_guest_booking_id')),
    uuid: toTrimmed(storage.getItem('prime_guest_uuid')),
    firstName: toTrimmed(storage.getItem('prime_guest_first_name')),
    verifiedAt: toTrimmed(storage.getItem('prime_guest_verified_at')),
  };
}

export function clearGuestSession(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  PRIME_GUEST_SESSION_KEYS.forEach((key) => {
    storage.removeItem(key);
  });
}

export function buildGuestHomeUrl(session: GuestSessionSnapshot): string {
  if (!session.uuid) {
    return '/';
  }

  return `/?uuid=${encodeURIComponent(session.uuid)}`;
}

export async function validateGuestToken(
  token: string,
  fetchImpl: typeof fetch = fetch,
): Promise<TokenValidationResult> {
  try {
    const response = await fetchImpl(`/api/guest-session?token=${encodeURIComponent(token)}`);

    if (response.ok) {
      return 'valid';
    }

    if (response.status === 410) {
      return 'expired';
    }

    if (response.status === 400 || response.status === 403 || response.status === 404) {
      return 'invalid';
    }

    return 'network_error';
  } catch {
    return 'network_error';
  }
}
