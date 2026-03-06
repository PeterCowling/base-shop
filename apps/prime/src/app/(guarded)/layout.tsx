'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ChatProvider } from '../../contexts/messaging/ChatProvider';
import { PinAuthProvider, usePinAuth } from '../../contexts/messaging/PinAuthProvider';
import { useSessionValidation } from '../../hooks/useSessionValidation';
import {
  clearGuestSession,
  validateGuestToken,
} from '../../lib/auth/guestSessionGuard';

type GateState = 'checking' | 'allowed' | 'denied' | 'network_error';

function GuardedGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePinAuth();
  const router = useRouter();
  const [gateState, setGateState] = useState<GateState>('checking');
  const invalidateGuestSession = useCallback(() => {
    clearGuestSession();
    setGateState('denied');
    router.replace('/find-my-stay');
  }, [router]);

  useSessionValidation({
    enabled: gateState === 'allowed' && !isAuthenticated,
    onInvalidOrExpired: invalidateGuestSession,
  });

  useEffect(() => {
    let isMounted = true;

    async function resolveAccess() {
      if (isAuthenticated) {
        if (isMounted) {
          setGateState('allowed');
        }
        return;
      }

      // prime_session HttpOnly cookie is sent automatically on this same-origin request
      const validation = await validateGuestToken();
      if (!isMounted) {
        return;
      }

      if (validation === 'valid') {
        setGateState('allowed');
        return;
      }

      if (validation === 'network_error') {
        setGateState('network_error');
        return;
      }

      invalidateGuestSession();
    }

    void resolveAccess();

    return () => {
      isMounted = false;
    };
  }, [invalidateGuestSession, isAuthenticated, router]);

  if (gateState === 'checking') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (gateState === 'network_error') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Cannot verify your session</h1>
          <p className="mb-6 text-muted-foreground">
            We couldn&apos;t reach the server to confirm your access. Please check your
            connection and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (gateState === 'denied') {
    return null;
  }

  return <>{children}</>;
}

export default function GuardedLayout({ children }: { children: ReactNode }) {
  return (
    <PinAuthProvider>
      <ChatProvider>
        <GuardedGate>{children}</GuardedGate>
      </ChatProvider>
    </PinAuthProvider>
  );
}
