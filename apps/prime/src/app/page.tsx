'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import GuardedHomeExperience from '../components/homepage/GuardedHomeExperience';
import { ChatProvider } from '../contexts/messaging/ChatProvider';
import { PinAuthProvider } from '../contexts/messaging/PinAuthProvider';
import { clearGuestSession, readGuestSession, validateGuestToken } from '../lib/auth/guestSessionGuard';
import { canAccessStaffOwnerRoutes } from '../lib/security/staffOwnerGate';

type RootMode = 'checking' | 'guest' | 'public';

export default function HomePage() {
  const [mode, setMode] = useState<RootMode>('checking');

  useEffect(() => {
    let isMounted = true;

    async function resolveMode() {
      const session = readGuestSession();

      if (!session.token) {
        if (isMounted) {
          setMode('public');
        }
        return;
      }

      const result = await validateGuestToken(session.token);
      if (!isMounted) {
        return;
      }

      if (result === 'valid' || result === 'network_error') {
        setMode('guest');
        return;
      }

      clearGuestSession();
      setMode('public');
    }

    void resolveMode();

    return () => {
      isMounted = false;
    };
  }, []);

  if (mode === 'checking') {
    return (
      <main className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (mode === 'guest') {
    return (
      <PinAuthProvider>
        <ChatProvider>
          <GuardedHomeExperience />
        </ChatProvider>
      </PinAuthProvider>
    );
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">
          Prime Guest Portal
        </h1>
        <p className="mb-8 text-muted-foreground">
          Welcome to the guest services portal
        </p>
        <div className="space-y-4">
          <Link
            href="/find-my-stay"
            className="block w-full rounded-lg bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Find My Stay
          </Link>
          {canAccessStaffOwnerRoutes() && (
            <Link
              href="/staff-lookup"
              className="block w-full rounded-lg border border-border px-6 py-3 text-foreground hover:bg-muted"
            >
              Staff Lookup
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
