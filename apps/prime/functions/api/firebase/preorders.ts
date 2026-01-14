/**
 * CF Pages Function: /api/firebase/preorders
 *
 * Handles preorder operations for a booking.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface Preorder {
  bookingId: string;
  items: Array<{ id: string; quantity: number }>;
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');

  if (!bookingId) {
    return errorResponse('bookingId parameter is required', 400);
  }

  try {
    const firebase = new FirebaseRest(env);
    const preorder = await firebase.get<Preorder>(`preorders/${bookingId}`);

    if (!preorder) {
      return jsonResponse({ preorder: null });
    }

    return jsonResponse({ preorder });
  } catch (error) {
    console.error('Error fetching preorder:', error);
    return errorResponse('Failed to fetch preorder', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as Preorder;

    if (!body.bookingId) {
      return errorResponse('bookingId is required', 400);
    }

    const firebase = new FirebaseRest(env);
    await firebase.set(`preorders/${body.bookingId}`, {
      ...body,
      createdAt: new Date().toISOString(),
    });

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error saving preorder:', error);
    return errorResponse('Failed to save preorder', 500);
  }
};
