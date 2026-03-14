'use client';

import { useEffect, useRef } from 'react';

import { validateGuestToken } from '../lib/auth/guestSessionGuard';

interface UseSessionValidationOptions {
  enabled: boolean;
  intervalMs?: number;
  onInvalidOrExpired: () => void;
}

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

export function useSessionValidation({
  enabled,
  intervalMs = DEFAULT_INTERVAL_MS,
  onInvalidOrExpired,
}: UseSessionValidationOptions): void {
  // Store the latest callback in a ref so the interval doesn't restart when
  // callers pass an inline (non-memoized) function on each render.
  const callbackRef = useRef(onInvalidOrExpired);
  callbackRef.current = onInvalidOrExpired;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isActive = true;

    const validate = async () => {
      // prime_session HttpOnly cookie is sent automatically on this same-origin request
      const result = await validateGuestToken();

      if (!isActive) {
        return;
      }

      if (result.status === 'expired' || result.status === 'invalid') {
        callbackRef.current();
      }
    };

    void validate();
    const intervalId = window.setInterval(() => {
      void validate();
    }, intervalMs);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs]);
}

export default useSessionValidation;
