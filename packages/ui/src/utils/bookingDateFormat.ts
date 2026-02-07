export type BookingDateFormat = {
  dateFormat: string;
  placeholder: string;
  inputLocale: string;
};

const DEFAULT_US_FORMAT: BookingDateFormat = {
  dateFormat: "MM/dd/yyyy",
  placeholder: "MM/DD/YYYY",
  inputLocale: "en-US",
};

export function resolveBookingDateFormat(locale?: string | null): BookingDateFormat {
  const normalized = locale?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return DEFAULT_US_FORMAT;
  }

  if (normalized === "en-gb") {
    return { dateFormat: "dd/MM/yyyy", placeholder: "DD/MM/YYYY", inputLocale: "en-GB" };
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return DEFAULT_US_FORMAT;
  }

  if (normalized.startsWith("it")) {
    return { dateFormat: "dd/MM/yyyy", placeholder: "gg/mm/aaaa", inputLocale: "it-IT" };
  }

  return {
    dateFormat: "dd/MM/yyyy",
    placeholder: "DD/MM/YYYY",
    inputLocale: normalized || "en-US",
  };
}
