/**
 * Prime messaging channel identifiers shared between reception and prime functions.
 *
 * This module is the single source of truth for Prime channel names. Both apps
 * import from @acme/lib/prime so a channel rename becomes a compile error rather
 * than a silent runtime mismatch.
 *
 * @module @acme/lib/prime
 */

/**
 * The three Prime messaging channels, ordered by specificity.
 * Use `PRIME_CHANNELS` to compose reception's inboxChannels array:
 *   export const inboxChannels = ["email", ...PRIME_CHANNELS] as const;
 */
export const PRIME_CHANNELS = [
  'prime_direct',
  'prime_broadcast',
  'prime_activity',
] as const;

/**
 * Union of Prime channel name strings.
 * Matches `PrimeReviewChannel` in apps/prime/functions/lib/prime-review-api.ts.
 */
export type PrimeReviewChannel = (typeof PRIME_CHANNELS)[number];
