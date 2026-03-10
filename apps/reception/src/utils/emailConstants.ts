function trimOrFallback(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

const isTestEnvironment = process.env.NODE_ENV === "test";

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

export const EMAIL_TEST_MODE =
  process.env.NEXT_PUBLIC_BOOKING_EMAIL_TEST_MODE === "true";
export const EMAIL_TEST_ADDRESS = trimOrFallback(
  process.env.NEXT_PUBLIC_BOOKING_EMAIL_TEST_ADDRESS,
  isTestEnvironment ? "peter.cowling1976@gmail.com" : ""
);
export const OCCUPANT_LINK_PREFIX = trimOrFallback(
  process.env.NEXT_PUBLIC_BOOKING_OCCUPANT_LINK_PREFIX,
  isTestEnvironment ? "https://prime-egt.pages.dev/booking-details?uuid=" : ""
);
export const FIREBASE_BASE_URL = stripTrailingSlashes(
  trimOrFallback(
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    isTestEnvironment
      ? "https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app"
      : ""
  )
);
