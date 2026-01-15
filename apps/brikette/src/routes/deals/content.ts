import type { TFunction } from "i18next";

import type { FallbackTranslator } from "./fallback";
import { getFallbackValue } from "./fallback";
import { PRIMARY_DEAL, type DealConfig } from "./deals";

export type PerkItem = {
  title: string;
  subtitle?: string;
};

const normalizePerkItem = (item: unknown): PerkItem | null => {
  if (typeof item === "string") {
    return { title: item };
  }
  if (typeof item === "object" && item !== null) {
    const maybe = item as { title?: unknown; subtitle?: unknown };
    if (typeof maybe.title === "string") {
      const perk: PerkItem = { title: maybe.title };
      if (typeof maybe.subtitle === "string") {
        perk.subtitle = maybe.subtitle;
      }
      return perk;
    }
  }
  return null;
};

const normalizePerks = (raw: unknown): PerkItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizePerkItem).filter((item): item is PerkItem => Boolean(item?.title?.trim()));
};

export function buildPerksList(t: TFunction, englishT: TFunction): PerkItem[] {
  const raw = t("perksList", { returnObjects: true });
  const normalized = normalizePerks(raw);
  if (normalized.length) return normalized;

  const fallback = englishT("perksList", { returnObjects: true });
  const fallbackNormalized = normalizePerks(fallback);
  if (fallbackNormalized.length) return fallbackNormalized;

  const fallbackFromJson = getFallbackValue("perksList");
  const jsonNormalized = normalizePerks(fallbackFromJson);
  if (jsonNormalized.length) return jsonNormalized;

  return [];
}

export function resolvePerksHeading(directBookingPerksLabel: string, ft: FallbackTranslator): string {
  return directBookingPerksLabel !== "directBookingPerks"
    ? directBookingPerksLabel
    : ft("perksHeading");
}

export function buildRestrictions(ft: FallbackTranslator, deal: DealConfig = PRIMARY_DEAL): string[] {
  const restrictions: string[] = [];

  if (typeof deal.rules.minDaysAhead === "number") {
    restrictions.push(ft("restrictions.minAdvance", { days: deal.rules.minDaysAhead }));
  }

  if (typeof deal.rules.minNights === "number" || typeof deal.rules.maxNights === "number") {
    restrictions.push(ft("restrictions.los", { min: deal.rules.minNights, max: deal.rules.maxNights }));
  }

  if (deal.rules.rateType === "non_refundable") {
    restrictions.push(ft("restrictions.nonRefundable"));
  }

  if (deal.rules.stacksWithDirectDiscount) {
    restrictions.push(ft("restrictions.stackable", { percent: deal.discountPct }));
  }

  restrictions.push(ft("restrictions.other"));

  return restrictions.filter((item) => typeof item === "string" && item.trim().length > 0);
}

export function resolveActiveCtaLabel(activeCtaLabel: string, bookNowLabel: string, ft: FallbackTranslator): string {
  if (activeCtaLabel !== "reserveNow") return activeCtaLabel;
  if (bookNowLabel !== "bookNow") return bookNowLabel;
  return ft("dealCard.cta.bookDirect");
}

export function resolveExpiredCtaLabel(
  checkAvailabilityLabel: string,
  activeCtaLabel: string,
  bookNowLabel: string,
  ft: FallbackTranslator,
): string {
  if (checkAvailabilityLabel !== "checkAvailability") return checkAvailabilityLabel;
  return resolveActiveCtaLabel(activeCtaLabel, bookNowLabel, ft);
}
