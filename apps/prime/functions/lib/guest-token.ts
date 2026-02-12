/**
 * Shared guest session token utilities.
 *
 * Used by find-booking API and pre-arrival email generation
 * to create secure, time-limited deep links into the guest portal.
 */

import type { FirebaseRest } from './firebase-rest';

export interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

export function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function computeTokenExpiry(checkOutDate: string, now: Date): string {
  const checkout = new Date(checkOutDate);
  if (!Number.isNaN(checkout.getTime())) {
    const expiresAt = new Date(checkout.getTime() + 48 * 60 * 60 * 1000);
    return expiresAt.toISOString();
  }

  // Fallback: 30 days from now
  const fallback = new Date(now.getTime());
  fallback.setDate(fallback.getDate() + 30);
  return fallback.toISOString();
}

/**
 * Create a guest session token in Firebase and return the deep link path.
 *
 * Returns a path like `/g/abc123def456` that the guest can use to access
 * the portal after a one-time last-name verification.
 */
export async function createGuestDeepLink(
  firebase: FirebaseRest,
  opts: {
    bookingId: string;
    guestUuid: string;
    checkOutDate: string;
    baseUrl: string;
  },
): Promise<string> {
  const now = new Date();
  const token = generateToken();
  const tokenData: GuestSessionToken = {
    bookingId: opts.bookingId,
    guestUuid: opts.guestUuid,
    createdAt: now.toISOString(),
    expiresAt: computeTokenExpiry(opts.checkOutDate, now),
  };

  await firebase.set(`guestSessionsByToken/${token}`, tokenData);

  return `${opts.baseUrl}/g/${token}`;
}
