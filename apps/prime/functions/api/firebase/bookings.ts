/**
 * CF Pages Function: /api/firebase/bookings
 *
 * Retrieves bookings for a guest by UUID.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  occupants: string[];
  [key: string]: unknown;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const uuid = url.searchParams.get('uuid');

  if (!uuid) {
    return errorResponse('UUID parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);
    const allBookings = await firebase.get<Record<string, Booking>>('bookings');

    if (!allBookings) {
      return jsonResponse({ bookings: [] });
    }

    // Filter bookings where uuid is in occupants array
    const guestBookings = Object.entries(allBookings)
      .filter(([_, booking]) => booking.occupants?.includes(uuid))
      .map(([id, booking]) => ({ ...booking, id }));

    return jsonResponse({ bookings: guestBookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return errorResponse('Failed to fetch bookings', 500);
  }
};
