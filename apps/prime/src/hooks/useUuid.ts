// src/hooks/useUuid.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

import logger from '@acme/lib/logger/client';

import { useAuthSession } from '@/contexts/auth/AuthSessionContext';
import { recordActivationFunnelEvent } from '@/lib/analytics/activationFunnel';
import { zodErrorToString } from '@/utils/zodErrorToString';

/**
 * Validates whether the provided string is a recognized occupant ID.
 */
const UUID_REGEX = /^occ_\d{13}$/i;

const uuidSchema = z.string().regex(UUID_REGEX);

/**
 * useUuid
 *
 * Retrieves and validates the guest UUID with the following priority:
 *   1. Server-confirmed guestUuid from AuthSessionContext (populated via prime_session cookie)
 *   2. localStorage['prime_guest_uuid'] fallback (used on root page / transient failures)
 *
 * If the URL ?uuid= param differs from the resolved uuid, a mismatch analytics event is
 * emitted and the context/localStorage uuid wins. This eliminates the URL tamper vector.
 *
 * NOTE: app/page.tsx (root page) is outside GuardedGate and does not have AuthSessionContext —
 * useAuthSession() returns { guestUuid: null } and this hook falls back to localStorage.
 * This is intentional: root-page bookmarks use a uuid written from localStorage in
 * buildGuestHomeUrl(), so URL and localStorage always match on the root page.
 *
 * If both sources are unavailable, redirects to /error (same as previous behavior).
 */
export default function useUuid(): string {
  const [uuid, setUuid] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { guestUuid: contextUuid } = useAuthSession();

  useEffect(() => {
    // 1. Try context first (server-confirmed uuid from prime_session cookie)
    let resolvedUuid: string | null = contextUuid ?? null;

    // 2. Fall back to localStorage if context is not available
    if (!resolvedUuid) {
      const stored = localStorage.getItem('prime_guest_uuid')?.trim() || '';
      if (stored) {
        resolvedUuid = stored;
      }
    }

    // 3. Check URL param for mismatch detection (advisory only — not the primary source)
    const urlUuid = searchParams?.get('uuid')?.trim() ?? null;
    if (urlUuid && resolvedUuid && urlUuid !== resolvedUuid) {
      // URL uuid differs from server-confirmed uuid — potential tamper attempt.
      // Context/localStorage wins; emit mismatch event for observability.
      logger.warn(
        `UUID mismatch: URL param "${urlUuid}" differs from session uuid "${resolvedUuid}". Using session uuid.`,
      );
      recordActivationFunnelEvent({
        type: 'utility_action_used',
        sessionKey: resolvedUuid,
        route: typeof window !== 'undefined' ? window.location.pathname : '',
        context: {
          utilityAction: 'security_uuid_mismatch',
          urlUuid,
          sessionUuid: resolvedUuid,
        },
      });
    }

    // 4. Already have the same resolved uuid in state — no update needed
    if (resolvedUuid === uuid && uuid !== '') {
      return;
    }

    // 5. No uuid found from any source → redirect to /error
    if (!resolvedUuid) {
      logger.error(
        `Redirecting to /error: Required 'uuid' value is missing from session and guest session. URL param: ${JSON.stringify(urlUuid)}`,
      );
      router.replace('/error');
      return;
    }

    // 6. Validate uuid format
    const parsed = uuidSchema.safeParse(resolvedUuid);
    if (!parsed.success) {
      const details = zodErrorToString(parsed.error);
      logger.error(
        `Redirecting to /error: Invalid uuid format (${details}). Value: "${resolvedUuid}"`,
      );
      router.replace('/error');
      return;
    }

    // 7. Valid uuid — update state
    setUuid(resolvedUuid);
  }, [contextUuid, searchParams, uuid, router]);

  return uuid;
}
