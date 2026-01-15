// API Route: /api/firebase/preorders
// Server-side Firebase query for preorders

import { get, ref } from 'firebase/database';
import { db } from '@/services/firebase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingRef = searchParams.get('bookingRef');

  if (!bookingRef) {
    return NextResponse.json(
      { error: 'bookingRef parameter is required' },
      { status: 400 }
    );
  }

  try {
    const preordersRef = ref(db, `preorder/${bookingRef}`);
    const snapshot = await get(preordersRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ preorders: null });
    }

    const preorders = snapshot.val();

    return NextResponse.json(
      { preorders },
      {
        headers: {
          'Cache-Control': 'private, max-age=120', // 2 minutes
        },
      }
    );
  } catch (error) {
    console.error('Error fetching preorders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preorders' },
      { status: 500 }
    );
  }
}
