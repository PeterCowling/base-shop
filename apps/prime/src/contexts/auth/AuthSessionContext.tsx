'use client';

import { createContext, useContext } from 'react';

export interface AuthSessionContextValue {
  guestUuid: string | null;
}

const DEFAULT_VALUE: AuthSessionContextValue = { guestUuid: null };

export const AuthSessionContext = createContext<AuthSessionContextValue>(DEFAULT_VALUE);

/**
 * useAuthSession
 *
 * Returns the server-confirmed guestUuid from the active prime_session cookie.
 * Outside GuardedGate (e.g. app/page.tsx root page), this returns { guestUuid: null }
 * and callers fall back to localStorage — this is intentional for the root page path.
 */
export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext);
}
