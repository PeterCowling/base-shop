'use client';

import { useEffect } from 'react';

import { validateGuestToken } from '../lib/auth/guestSessionGuard';

interface UseSessionValidationOptions {
  token: string | null;
  enabled: boolean;
  intervalMs?: number;
  onInvalidOrExpired: () => void;
}

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;

export function useSessionValidation({
  token,
  enabled,
  intervalMs = DEFAULT_INTERVAL_MS,
  onInvalidOrExpired,
}: UseSessionValidationOptions): void {
  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    let isActive = true;

    const validate = async () => {
      const result = await validateGuestToken(token);

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
  }, [enabled, intervalMs, onInvalidOrExpired, token]);
}

export default useSessionValidation;
