import type { TFunction } from "i18next";

import { DISCOUNT_PCT } from "./constants";
import type { FallbackTranslator } from "./fallback";
import { getFallbackValue } from "./fallback";

export function buildPerksList(t: TFunction, englishT: TFunction): string[] {
  const raw = t("perksList", { returnObjects: true });
  if (Array.isArray(raw)) {
    return (raw as unknown[]).filter((item): item is string => typeof item === "string");
  }

  const fallback = englishT("perksList", { returnObjects: true });
  if (Array.isArray(fallback)) {
    return (fallback as unknown[]).filter((item): item is string => typeof item === "string");
  }

  const fallbackFromJson = getFallbackValue("perksList");
  if (Array.isArray(fallbackFromJson)) {
    return fallbackFromJson.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export function buildRestrictions(ft: FallbackTranslator): string[] {
  return [
    ft("restrictions.minAdvance", {
      days: 10,
    }),
    ft("restrictions.los", {
      min: 2,
      max: 8,
    }),
    ft("restrictions.nonRefundable"),
    ft("restrictions.stackable", {
      percent: DISCOUNT_PCT,
    }),
    ft("restrictions.other"),
  ];
}

export function resolvePerksHeading(directBookingPerksLabel: string, ft: FallbackTranslator): string {
  return directBookingPerksLabel !== "directBookingPerks"
    ? directBookingPerksLabel
    : ft("perksHeading");
}

export function resolveExpiredCtaLabel(
  checkAvailabilityLabel: string,
  reserveLabel: string,
  bookLabel: string,
  ft: FallbackTranslator
): string {
  if (checkAvailabilityLabel !== "checkAvailability") {
    return checkAvailabilityLabel;
  }

  return resolveActiveCtaLabel(reserveLabel, bookLabel, ft);
}

export function resolveActiveCtaLabel(
  reserveLabel: string,
  bookLabel: string,
  ft: FallbackTranslator
): string {
  if (reserveLabel !== "reserveNow") {
    return reserveLabel;
  }

  if (bookLabel !== "bookNow") {
    return bookLabel;
  }

  return ft("buttonReserve");
}

export { DEAL_VALIDITY } from "./constants";
