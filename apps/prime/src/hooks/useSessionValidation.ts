'use client';

import { useEffect } from 'react';

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

      if (result === 'expired' || result === 'invalid') {
        onInvalidOrExpired();
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
  }, [enabled, intervalMs, onInvalidOrExpired]);
}

export default useSessionValidation;
