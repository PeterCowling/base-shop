// API Route: /api/firebase/guest-details
// Server-side Firebase query for guest details

import { get, ref } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const bookingRef = searchParams.get('bookingRef');

  if (!shopId || !bookingRef) {
    return NextResponse.json(
      { error: 'shopId and bookingRef parameters are required' },
      { status: 400 }
    );
  }

  try {
    const guestDetailsRef = ref(db, `guestsDetails/${shopId}/${bookingRef}`);
    const snapshot = await get(guestDetailsRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ guestDetails: null });
    }

    const guestDetails = snapshot.val();

    return NextResponse.json(
      { guestDetails },
      {
        headers: {
          'Cache-Control': 'private, max-age=600', // 10 minutes
        },
      }
    );
  } catch (error) {
    console.error('Error fetching guest details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest details' },
      { status: 500 }
    );
  }
}
