/**
 * CF Pages Function: /api/firebase/guest-details
 *
 * Retrieves guest details by UUID.
 */

import { FirebaseRest, jsonResponse, errorResponse } from '../../lib/firebase-rest';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}

interface Guest {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  language?: string;
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
    const guest = await firebase.get<Guest>(`guests/${uuid}`);

    if (!guest) {
      return errorResponse('Guest not found', 404);
    }

    return jsonResponse(guest);
  } catch (error) {
    console.error('Error fetching guest details:', error);
    return errorResponse('Failed to fetch guest details', 500);
  }
};
