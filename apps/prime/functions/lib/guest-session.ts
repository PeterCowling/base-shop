import { FirebaseRest, errorResponse } from './firebase-rest';

export interface GuestSessionToken {
  bookingId: string;
  guestUuid: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface GuestSessionAuthResult {
  token: string;
  session: GuestSessionToken;
}

export function isGuestSessionExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date();
}

export async function validateGuestSessionToken<Env extends {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
}>(
  token: string | null,
  env: Env,
): Promise<GuestSessionAuthResult | Response> {
  if (!token) {
    return errorResponse('token is required', 400);
  }

  const firebase = new FirebaseRest(env);
  const session = await firebase.get<GuestSessionToken>(`guestSessionsByToken/${token}`);

  if (!session) {
    return errorResponse('Token not found', 404);
  }

  if (isGuestSessionExpired(session.expiresAt)) {
    return errorResponse('Token expired', 410);
  }

  return {
    token,
    session,
  };
}
