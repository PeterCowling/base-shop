import { addDays } from "@/utils/dateUtils";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const HOSTEL_MIN_STAY_NIGHTS = 2;

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

export function isValidMinStayRange(checkin: string, checkout: string): boolean {
  const minCheckout = getMinCheckoutForStay(checkin);
  if (!minCheckout || !isCanonicalIsoDate(checkout)) return false;
  return checkout >= minCheckout;
}

export function ensureMinCheckoutForStay(checkin: string, checkout: string): string {
  const minCheckout = getMinCheckoutForStay(checkin);
  if (!minCheckout) return checkout;
  if (!isCanonicalIsoDate(checkout) || checkout < minCheckout) return minCheckout;
  return checkout;
}
