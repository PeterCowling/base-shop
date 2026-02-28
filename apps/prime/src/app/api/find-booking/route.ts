/**
 * Next.js route handler: GET /api/find-booking
 *
 * Dev-env mirror of the Cloudflare Pages Function at
 * apps/prime/functions/api/find-booking.ts
 *
 * Used in local development only — Cloudflare Pages Functions handle
 * this endpoint in staging and production.
 */

import { NextResponse } from 'next/server';

const FIREBASE_DATABASE_URL =
  process.env.CF_FIREBASE_DATABASE_URL ??
  'https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app';

const FIREBASE_API_KEY = process.env.CF_FIREBASE_API_KEY;

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

interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
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

async function firebaseSet<T>(path: string, data: T): Promise<void> {
  const res = await fetch(buildFirebaseUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Firebase SET failed: ${res.status}`);
}

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function computeTokenExpiry(checkOutDate: string, now: Date): string {
  const checkout = new Date(checkOutDate);
  if (!Number.isNaN(checkout.getTime())) {
    return new Date(checkout.getTime() + 48 * 60 * 60 * 1000).toISOString();
  }
  const fallback = new Date(now.getTime());
  fallback.setDate(fallback.getDate() + 30);
  return fallback.toISOString();
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const surname = searchParams.get('surname');
  const bookingRef = searchParams.get('bookingRef');

  if (!surname || !bookingRef) {
    return NextResponse.json(
      { error: 'surname and bookingRef parameters are required' },
      { status: 400 },
    );
  }

  try {
    const normalizedRef = bookingRef.toUpperCase().trim();
    const normalizedSurname = surname.toLowerCase().trim();

    const booking = await firebaseGet<Record<string, BookingOccupant>>(`bookings/${normalizedRef}`);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const guestDetailsAll = await firebaseGet<Record<string, GuestDetails>>(
      `guestsDetails/${normalizedRef}`,
    );
    if (!guestDetailsAll) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const occupantKeys = Object.keys(booking).filter((key) => key.startsWith('occ_'));
    let matchedOccupantId: string | null = null;
    for (const occId of occupantKeys) {
      const details = guestDetailsAll[occId];
      if (details?.lastName && details.lastName.toLowerCase().trim() === normalizedSurname) {
        matchedOccupantId = occId;
        break;
      }
    }

    if (!matchedOccupantId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const leadOccupantId =
      occupantKeys.find((id) => booking[id]?.leadGuest) || occupantKeys[0] || matchedOccupantId;
    const leadOccupant = booking[leadOccupantId];

    const now = new Date();
    const token = generateToken();
    const tokenData: GuestSessionToken = {
      bookingId: normalizedRef,
      guestUuid: leadOccupantId,
      createdAt: now.toISOString(),
      expiresAt: computeTokenExpiry(leadOccupant?.checkOutDate ?? '', now),
    };

    await firebaseSet(`guestSessionsByToken/${token}`, tokenData);

    return NextResponse.json({ redirectUrl: `/g/${token}` });
  } catch (error) {
    console.error('Error finding booking:', error);
    return NextResponse.json({ error: 'Failed to find booking' }, { status: 500 });
  }
}
