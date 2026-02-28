import { addDays } from "@/utils/dateUtils";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const HOSTEL_MIN_STAY_NIGHTS = 2;
export const HOSTEL_MAX_STAY_NIGHTS = 8;
export const HOSTEL_MIN_PAX = 1;
export const HOSTEL_MAX_PAX = 8;

function isCanonicalIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  try {
    return addDays(value, 0) === value;
  } catch {
    return false;
  }
}

export function getMinCheckoutForStay(checkin: string): string | null {
  if (!isCanonicalIsoDate(checkin)) return null;
  return addDays(checkin, HOSTEL_MIN_STAY_NIGHTS);
}

export function getMaxCheckoutForStay(checkin: string): string | null {
  if (!isCanonicalIsoDate(checkin)) return null;
  return addDays(checkin, HOSTEL_MAX_STAY_NIGHTS);
}

export function isValidStayRange(checkin: string, checkout: string): boolean {
  const minCheckout = getMinCheckoutForStay(checkin);
  const maxCheckout = getMaxCheckoutForStay(checkin);
  if (!minCheckout || !maxCheckout || !isCanonicalIsoDate(checkout)) return false;
  return checkout >= minCheckout && checkout <= maxCheckout;
}

export function isValidMinStayRange(checkin: string, checkout: string): boolean {
  return isValidStayRange(checkin, checkout);
}

export function normalizeCheckoutForStay(checkin: string, checkout: string): string {
  const minCheckout = getMinCheckoutForStay(checkin);
  const maxCheckout = getMaxCheckoutForStay(checkin);
  if (!minCheckout || !maxCheckout) return checkout;
  if (!isCanonicalIsoDate(checkout) || checkout < minCheckout) return minCheckout;
  if (checkout > maxCheckout) return maxCheckout;
  return checkout;
}

export function ensureMinCheckoutForStay(checkin: string, checkout: string): string {
  return normalizeCheckoutForStay(checkin, checkout);
}

export function isValidPax(pax: number): boolean {
  return Number.isInteger(pax) && pax >= HOSTEL_MIN_PAX && pax <= HOSTEL_MAX_PAX;
}
