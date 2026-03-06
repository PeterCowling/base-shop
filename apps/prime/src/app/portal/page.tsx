/* eslint-disable ds/container-widths-only-at -- BRIK-3 prime DS rules deferred */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [status, setStatus] = useState<'loading' | 'network_error' | 'guided'>('loading');
  const [session, setSession] = useState<GuestSessionSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      const currentSession = readGuestSession();
      const forcePersonalizationEdit = new URLSearchParams(window.location.search).get('edit') === 'personalization';

      // prime_session HttpOnly cookie is sent automatically on this same-origin request
      const result = await validateGuestToken();
      if (!isMounted) {
        return;
      }

      if (result === 'valid') {
        if (!forcePersonalizationEdit && hasCompletedGuidedOnboarding(currentSession)) {
          router.replace(buildGuestHomeUrl(currentSession));
          return;
        }

        setSession(currentSession);
        setStatus('guided');
        return;
      }

      if (result === 'network_error') {
        setStatus('network_error');
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
      <main className="flex min-h-svh items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  if (status === 'network_error') {
    return (
      <main className="min-h-svh bg-muted p-4">
        <div className="mx-auto max-w-md rounded-xl bg-card p-6 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-foreground">Cannot verify your session</h1>
          <p className="mb-6 text-muted-foreground">
            We couldn&apos;t reach the server to confirm your session. Please check your
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
