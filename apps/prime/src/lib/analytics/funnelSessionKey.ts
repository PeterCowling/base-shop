/**
 * getFunnelSessionKey
 *
 * Returns a stable identifier for the current guest session, used as the
 * `sessionKey` field in activation funnel events. Prefers the guest UUID,
 * falls back to booking ID, then returns 'unknown-session' when neither is
 * available or when running server-side.
 */
export function getFunnelSessionKey(): string {
  if (typeof window === 'undefined') {
    return 'unknown-session';
  }

  return (
    localStorage.getItem('prime_guest_uuid') ||
    localStorage.getItem('prime_guest_booking_id') ||
    'unknown-session'
  );
}
