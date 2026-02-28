/**
 * Next.js route handler: GET + POST /api/guest-session
 *
 * Dev-env mirror of the Cloudflare Pages Function at
 * apps/prime/functions/api/guest-session.ts
 *
 * Used in local development only — Cloudflare Pages Functions handle
 * this endpoint in staging and production.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const FIREBASE_DATABASE_URL =
  process.env.CF_FIREBASE_DATABASE_URL ??
  'https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app';

const FIREBASE_API_KEY = process.env.CF_FIREBASE_API_KEY;

interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

interface BookingOccupant {
  checkInDate: string;
  checkOutDate: string;
  leadGuest?: boolean;
  roomNumbers?: string[];
}

interface GuestDetails {
  firstName?: string;
  lastName?: string;
}

function buildFirebaseUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${FIREBASE_DATABASE_URL}${cleanPath}.json`);
  if (FIREBASE_API_KEY) {
    url.searchParams.set('auth', FIREBASE_API_KEY);
  }
  return url.toString();
}

async function firebaseGet<T>(path: string): Promise<T | null> {
  const res = await fetch(buildFirebaseUrl(path));
  if (!res.ok) throw new Error(`Firebase GET failed: ${res.status}`);
  return (await res.json()) as T | null;
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'token parameter is required' }, { status: 400 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const session = await firebaseGet<GuestSessionToken>(`guestSessionsByToken/${token}`);
    if (!session) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    if (isExpired(session.expiresAt)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    return NextResponse.json({ status: 'ok', expiresAt: session.expiresAt }); // i18n-exempt -- PRIME-101 machine-readable API status [ttl=2026-12-31]
  } catch (error) {
    console.error('Error validating guest token:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return NextResponse.json({ error: 'Failed to validate token' }, { status: 500 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
}

export async function POST(request: Request): Promise<Response> {
  let token = '';
  let lastName = '';

  try {
    const body = (await request.json()) as { token?: string; lastName?: string };
    token = body.token ?? '';
    lastName = body.lastName ?? '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  if (!token || !lastName) {
    return NextResponse.json({ error: 'token and lastName are required' }, { status: 400 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }

  try {
    const session = await firebaseGet<GuestSessionToken>(`guestSessionsByToken/${token}`);
    if (!session) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }
    if (isExpired(session.expiresAt)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const booking = await firebaseGet<Record<string, BookingOccupant>>(
      `bookings/${session.bookingId}`,
    );
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const occupantKeys = Object.keys(booking).filter((key) => key.startsWith('occ_'));
    let targetOccupantId: string | null = session.guestUuid;

    if (!targetOccupantId || !occupantKeys.includes(targetOccupantId)) {
      targetOccupantId =
        occupantKeys.find((id) => booking[id]?.leadGuest) ?? occupantKeys[0] ?? null;
    }

    if (!targetOccupantId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const guestDetails = await firebaseGet<GuestDetails>(
      `guestsDetails/${session.bookingId}/${targetOccupantId}`,
    );
    if (!guestDetails) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    const storedLastName = (guestDetails.lastName ?? '').trim().toLowerCase();
    const inputLastName = lastName.trim().toLowerCase();

    if (!storedLastName || storedLastName !== inputLastName) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 403 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
    }

    return NextResponse.json({
      bookingId: session.bookingId,
      guestUuid: targetOccupantId,
      guestFirstName: guestDetails.firstName ?? '',
    });
  } catch (error) {
    console.error('Error verifying guest session:', error); // i18n-exempt -- PRIME-101 developer log [ttl=2026-12-31]
    return NextResponse.json({ error: 'Failed to verify guest session' }, { status: 500 }); // i18n-exempt -- PRIME-101 machine-readable API error [ttl=2026-12-31]
  }
}
