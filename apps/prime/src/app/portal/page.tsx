'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import GuidedOnboardingFlow from '../../components/portal/GuidedOnboardingFlow';
import {
  buildGuestHomeUrl,
  clearGuestSession,
  type GuestSessionSnapshot,
  readGuestSession,
  validateGuestToken,
} from '../../lib/auth/guestSessionGuard';

const GUIDED_ONBOARDING_STORAGE_PREFIX = 'prime_guided_onboarding_complete';

function getGuidedOnboardingStorageKey(session: GuestSessionSnapshot): string {
  if (session.bookingId) {
    return `${GUIDED_ONBOARDING_STORAGE_PREFIX}:${session.bookingId}`;
  }

  return GUIDED_ONBOARDING_STORAGE_PREFIX;
}

function hasCompletedGuidedOnboarding(session: GuestSessionSnapshot): boolean {
  const key = getGuidedOnboardingStorageKey(session);
  return localStorage.getItem(key) === '1';
}

function markGuidedOnboardingComplete(session: GuestSessionSnapshot): void {
  const key = getGuidedOnboardingStorageKey(session);
  localStorage.setItem(key, '1');
}

export default function GuestPortalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'unavailable' | 'guided'>('loading');
  const [session, setSession] = useState<GuestSessionSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const currentSession = readGuestSession();
      const forcePersonalizationEdit = new URLSearchParams(window.location.search).get('edit') === 'personalization';

      if (!currentSession.token) {
        if (isMounted) {
          setStatus('unavailable');
        }
        return;
      }

      const result = await validateGuestToken(currentSession.token);
      if (!isMounted) {
        return;
      }

      if (result === 'valid' || result === 'network_error') {
        if (!forcePersonalizationEdit && hasCompletedGuidedOnboarding(currentSession)) {
          router.replace(buildGuestHomeUrl(currentSession));
          return;
        }

        setSession(currentSession);
        setStatus('guided');
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

  if (!session) {
    return null;
  }

  return (
    <GuidedOnboardingFlow
      guestFirstName={session.firstName}
      onComplete={() => {
        markGuidedOnboardingComplete(session);
        router.replace(buildGuestHomeUrl(session));
      }}
    />
  );
}
