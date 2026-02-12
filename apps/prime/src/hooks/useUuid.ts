// src/hooks/useUuid.ts
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';

import logger from '@/utils/logger';
import { zodErrorToString } from '@/utils/zodErrorToString';

/**
 * Validates whether the provided string is a recognized ID.
 * Adjust the pattern to match your real usage.
 */
const UUID_REGEX = /^occ_\d{13}$/i;

const uuidSchema = z.string().regex(UUID_REGEX);

/**
 * useUuid
 * Retrieves and validates the UUID from URL query params.
 * If missing or invalid, redirects to /error.
 */
export default function useUuid(): string {
  const [uuid, setUuid] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let uuidFromURL = searchParams?.get('uuid'); // Use 'let' if you might reassign (e.g., after trimming)

    // --- Optional but Recommended: Trim whitespace ---
    // Query parameters can sometimes have leading/trailing spaces
    if (uuidFromURL) {
      uuidFromURL = uuidFromURL.trim();
    }
    // --- End Trim ---

    // Perform checks *after* potential trimming
    if (uuidFromURL) {
      // If already in state and URL hasn't changed, do nothing
      // Compare trimmed version if you trimmed it
      if (uuidFromURL === uuid) {
        return;
      }
    }

    if (!uuidFromURL) {
      const storedUuid = localStorage.getItem('prime_guest_uuid')?.trim() || '';
      if (storedUuid) {
        uuidFromURL = storedUuid;
      }
    }

    // Missing or invalid UUID → redirect to error
    // The short-circuiting here correctly prevents validating an empty string
    if (!uuidFromURL) {
      logger.error(
        `Redirecting to /error: Required 'uuid' value is missing from URL and guest session. Received: ${JSON.stringify(uuidFromURL)}`,
      );
      router.replace('/error');
      return; // Exit useEffect early
    }

    // At this point, we know uuidFromURL is a non-empty string. Now check its format.
    const parsed = uuidSchema.safeParse(uuidFromURL);
    if (!parsed.success) {
      // CASE 2: UUID is present and non-empty, but its format is invalid.
      const details = zodErrorToString(parsed.error);

      logger.error(
        `Redirecting to /error: Invalid 'uuid' query parameter (${details}). Value: "${uuidFromURL}"`,
      );
      router.replace('/error');
      return; // Exit useEffect early
    }

    // Valid UUID → update state
    // At this point, uuidFromURL is guaranteed to be a non-null, non-empty, valid string
    setUuid(uuidFromURL);
  }, [searchParams, uuid, router]); // Keep dependencies as they are

  return uuid;
}
