'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import GuardedHomeExperience from '../components/homepage/GuardedHomeExperience';
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  if (mode === 'guest') {
    return <GuardedHomeExperience />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Prime Guest Portal
        </h1>
        <p className="mb-8 text-gray-600">
          Welcome to the guest services portal
        </p>
        <div className="space-y-4">
          <Link
            href="/find-my-stay"
            className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Find My Stay
          </Link>
          {canAccessStaffOwnerRoutes() && (
            <Link
              href="/staff-lookup"
              className="block w-full rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-100"
            >
              Staff Lookup
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
