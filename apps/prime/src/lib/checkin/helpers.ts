/**
 * Shared helpers for check-in code pages (staff-lookup and checkin).
 */

/**
 * Check if the user has staff-level access.
 */
export function isStaffRole(role: string | null): boolean {
  return role === 'staff' || role === 'admin' || role === 'owner';
}

/**
 * Format an ETA time string (HH:MM) into a 30-minute window.
 * e.g. "14:30" → "14:30 - 15:00"
 */
export function formatEtaWindow(window: string | null): string {
  if (!window) return '-';
  const [hours, minutes] = window.split(':').map(Number);
  const endMinutes = minutes + 30;
  const endHours = hours + Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  return `${window} - ${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
}

/**
 * Extract a check-in code from a URL pathname.
 * Handles both /checkin/BRK-XXXXX and /staff-lookup/BRK-XXXXX patterns.
 */
export function extractCodeFromPathname(
  pathname: string,
  prefix: 'checkin' | 'staff-lookup',
): string | null {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === prefix) {
    return segments[1];
  }
  return null;
}
