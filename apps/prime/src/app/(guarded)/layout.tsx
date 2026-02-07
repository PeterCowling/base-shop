'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ChatProvider } from '../../contexts/messaging/ChatProvider';
import { PinAuthProvider, usePinAuth } from '../../contexts/messaging/PinAuthProvider';
import {
  clearGuestSession,
  readGuestSession,
  validateGuestToken,
} from '../../lib/auth/guestSessionGuard';
import { useSessionValidation } from '../../hooks/useSessionValidation';

type GateState = 'checking' | 'allowed' | 'denied';

function GuardedGate({ children }: { children: ReactNode }) {
  const { isAuthenticated } = usePinAuth();
  const router = useRouter();
  const [gateState, setGateState] = useState<GateState>('checking');
  const [guestToken, setGuestToken] = useState<string | null>(null);

  const invalidateGuestSession = useCallback(() => {
    clearGuestSession();
    setGuestToken(null);
    setGateState('denied');
    router.replace('/find-my-stay');
  }, [router]);

  useSessionValidation({
    token: guestToken,
    enabled: gateState === 'allowed' && !isAuthenticated && !!guestToken,
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

      const session = readGuestSession();
      setGuestToken(session.token);

      if (!session.token) {
        if (isMounted) {
          setGateState('denied');
          router.replace('/');
        }
        return;
      }

      const validation = await validateGuestToken(session.token);
      if (!isMounted) {
        return;
      }

      if (validation === 'valid' || validation === 'network_error') {
        setGateState('allowed');
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
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
