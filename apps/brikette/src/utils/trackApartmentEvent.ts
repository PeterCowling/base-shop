// src/utils/trackApartmentEvent.ts
// GA4 event tracking for apartment pages

type ApartmentEventName =
  | "click_check_availability"
  | "click_whatsapp"
  | "video_play_stepfree_route";

type EventParams = Record<string, string | number | boolean>;

/**
 * Fire a GA4 event for apartment pages.
 * Safe to call when gtag is not loaded (e.g. dev/test environments).
 */
export function trackApartmentEvent(
  eventName: ApartmentEventName,
  params: EventParams,
): void {
  const win = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof win.gtag === "function") {
    win.gtag("event", eventName, params);
  }
}
