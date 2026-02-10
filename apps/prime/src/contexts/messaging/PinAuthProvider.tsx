'use client';

import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { bootstrapStaffAuthSession } from '../../services/staffAuthBootstrap';

interface StaffLockoutState {
  failedAttempts: number;
  attemptsRemaining: number;
  lockedUntil: number | null;
}

interface StaffAuthSessionSuccessResponse {
  customToken: string;
  uid: string;
  role: 'staff' | 'admin' | 'owner';
  claims?: Record<string, unknown>;
}

interface StaffAuthSessionFailureResponse {
  error?: string;
  failedAttempts?: number;
  attemptsRemaining?: number;
  lockedUntil?: number | null;
}

interface PinAuthContextValue {
  user: { id: string } | null;
  role: 'guest' | 'staff' | 'admin' | 'owner' | null;
  claims: Record<string, unknown> | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  lockout: StaffLockoutState | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
}

const PinAuthContext = createContext<PinAuthContextValue | null>(null);

const STORAGE_ROLE_KEY = 'prime_role';
const STORAGE_USER_ID_KEY = 'prime_user_id';
const STORAGE_AUTH_TOKEN_KEY = 'prime_staff_auth_token';
const STORAGE_CLAIMS_KEY = 'prime_staff_claims';

export function PinAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [role, setRole] = useState<'guest' | 'staff' | 'admin' | 'owner' | null>(null);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockout, setLockout] = useState<StaffLockoutState | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem(STORAGE_ROLE_KEY);
    const storedUserId = localStorage.getItem(STORAGE_USER_ID_KEY);
    const storedAuthToken = localStorage.getItem(STORAGE_AUTH_TOKEN_KEY);
    const storedClaims = localStorage.getItem(STORAGE_CLAIMS_KEY);

    if (!storedRole || !storedUserId || !storedAuthToken) {
      return;
    }

    const normalizedRole = storedRole as 'guest' | 'staff' | 'admin' | 'owner';
    setRole(normalizedRole);
    setUser({ id: storedUserId });
    setAuthToken(storedAuthToken);

    if (storedClaims) {
      try {
        setClaims(JSON.parse(storedClaims) as Record<string, unknown>);
      } catch {
        setClaims(null);
      }
    }
  }, []);

  async function login(pin: string): Promise<boolean> {
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setAuthError('PIN is required');
      return false;
    }

    setIsLoading(true);
    setAuthError(null);
    setLockout(null);

    let response: Response;
    try {
      response = await fetch('/api/staff-auth-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: trimmedPin }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reach staff auth service';
      setAuthError(message);
      setIsLoading(false);
      return false;
    }

    if (!response.ok) {
      let payload: StaffAuthSessionFailureResponse = {};
      try {
        payload = await response.json() as StaffAuthSessionFailureResponse;
      } catch {
        payload = {};
      }

      setAuthError(payload.error ?? 'Staff authentication failed');
      if (
        typeof payload.failedAttempts === 'number'
        && typeof payload.attemptsRemaining === 'number'
      ) {
        setLockout({
          failedAttempts: payload.failedAttempts,
          attemptsRemaining: payload.attemptsRemaining,
          lockedUntil: payload.lockedUntil ?? null,
        });
      }
      setIsLoading(false);
      return false;
    }

    const sessionPayload = await response.json() as StaffAuthSessionSuccessResponse;
    const bootstrapResult = await bootstrapStaffAuthSession(sessionPayload.customToken);
    if (bootstrapResult.ok === false) {
      setAuthError(bootstrapResult.message);
      setIsLoading(false);
      return false;
    }

    setUser({ id: bootstrapResult.userId });
    setRole(bootstrapResult.role);
    setClaims(bootstrapResult.claims);
    setAuthToken(bootstrapResult.idToken);
    setAuthError(null);
    setLockout(null);

    localStorage.setItem(STORAGE_ROLE_KEY, bootstrapResult.role);
    localStorage.setItem(STORAGE_USER_ID_KEY, bootstrapResult.userId);
    localStorage.setItem(STORAGE_AUTH_TOKEN_KEY, bootstrapResult.idToken);
    localStorage.setItem(STORAGE_CLAIMS_KEY, JSON.stringify(bootstrapResult.claims));

    setIsLoading(false);
    return true;
  }

  function logout() {
    setUser(null);
    setRole(null);
    setClaims(null);
    setAuthToken(null);
    setAuthError(null);
    setLockout(null);
    localStorage.removeItem(STORAGE_ROLE_KEY);
    localStorage.removeItem(STORAGE_USER_ID_KEY);
    localStorage.removeItem(STORAGE_AUTH_TOKEN_KEY);
    localStorage.removeItem(STORAGE_CLAIMS_KEY);
  }

  return (
    <PinAuthContext.Provider
      value={{
        user,
        role,
        claims,
        authToken,
        isAuthenticated: !!user,
        isLoading,
        authError,
        lockout,
        login,
        logout,
      }}
    >
      {children}
    </PinAuthContext.Provider>
  );
}

export function usePinAuth(): PinAuthContextValue {
  const context = useContext(PinAuthContext);
  if (!context) {
    // Safe default for SSR/static prerendering (no provider available)
    return {
      user: null,
      role: null,
      claims: null,
      authToken: null,
      isAuthenticated: false,
      isLoading: false,
      authError: null,
      lockout: null,
      login: async () => false,
      logout: () => {},
    };
  }
  return context;
}
