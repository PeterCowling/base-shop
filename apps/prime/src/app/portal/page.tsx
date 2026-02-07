'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  buildGuestHomeUrl,
  clearGuestSession,
  readGuestSession,
  validateGuestToken,
} from '../../lib/auth/guestSessionGuard';

export default function GuestPortalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unavailable'>('loading');

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const session = readGuestSession();

      if (!session.token) {
        if (isMounted) {
          setStatus('unavailable');
        }
        return;
      }

      const result = await validateGuestToken(session.token);
      if (!isMounted) {
        return;
      }

      if (result === 'valid' || result === 'network_error') {
        router.replace(buildGuestHomeUrl(session));
        return;
      }

      clearGuestSession();
      router.replace('/find-my-stay');
    }

    void validateSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  if (status === 'unavailable') {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Portal unavailable</h1>
          <p className="mb-6 text-gray-600">
            We couldn&apos;t find an active guest session. Please use your personal link.
          </p>
          <Link
            href="/find-my-stay"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Find my stay
          </Link>
        </div>
      </main>
    );
  }

  return null;
}
