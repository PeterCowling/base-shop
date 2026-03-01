export function buildBookingQueryString(checkin: string, checkout: string, pax: number | string): string {
  return `checkin=${encodeURIComponent(checkin)}&checkout=${encodeURIComponent(checkout)}&pax=${encodeURIComponent(String(pax))}`;
}
