/**
 * Allowed activity codes considered when determining email progress.
 *
 * Code 9 (CITY_TAX_PAYMENT) is included because a bug in the extension flow
 * (fixed in 90eafcfb62) incorrectly wrote code 9 to all occupants in a booking
 * regardless of balance, including future arrivals who had not yet checked in.
 * Guests who genuinely paid city tax also have code 12 (CHECKIN_COMPLETE), which
 * remains excluded, so they are correctly filtered out by that code instead.
 */
export const EMAIL_CODES = new Set<number>([
  1, 2, 3, 9, 11, 15, 17, 18, 19, 20, 24,
]);
