// API Route: /api/firebase/bookings
// Server-side Firebase query for bookings data

import { get, orderByChild, query, ref, startAt } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uuid = searchParams.get('uuid');

  if (!uuid) {
    return NextResponse.json(
      { error: 'UUID parameter is required' },
      { status: 400 }
    );
  }

  try {
    const bookingsRef = ref(db, 'bookings');
    const q = query(
      bookingsRef,
      orderByChild(`occupants/${uuid}`),
      startAt(true)
    );

    const snapshot = await get(q);

    if (!snapshot.exists()) {
      return NextResponse.json({ bookings: {} });
    }

    const bookings = snapshot.val();

    return NextResponse.json(
      { bookings },
      {
        headers: {
          'Cache-Control': 'private, max-age=300', // 5 minutes
        },
      }
    );
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
