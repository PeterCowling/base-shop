import type { TFunction } from "i18next";

import { formatMonthDay, formatPercent, isoDateToLocalStart, shouldIncludeYear } from "./dates";
import type { DealConfig } from "./deals";
import { getDealStatus } from "./status";

type DealsMetadataState = "active" | "upcoming" | "expired";

export type DealsMetadataCopy = {
  title: string;
  description: string;
  state: DealsMetadataState;
};

type ReadCopyOptions = {
  defaultValue: string;
} & Record<string, unknown>;

const readCopy = (t: TFunction, key: string, options: ReadCopyOptions): string => {
  const resolved = t(key, options) as string;
  if (!resolved || resolved.trim().length === 0 || resolved === key) {
    return options.defaultValue;
  }
  return resolved;
};

const firstDealByStatus = (deals: readonly DealConfig[], now: Date, target: DealsMetadataState) =>
  deals.find((deal) => getDealStatus(deal, now) === target);

export const resolveDealsMetadataCopy = (
  t: TFunction,
  lang: string,
  deals: readonly DealConfig[],
  now: Date = new Date(),
): DealsMetadataCopy => {
  const activeDeal = firstDealByStatus(deals, now, "active");
  const upcomingDeal = firstDealByStatus(deals, now, "upcoming");
  const candidate = activeDeal ?? upcomingDeal ?? null;

  if (!candidate) {
    const fallbackTitle = readCopy(t, "meta.title", { defaultValue: "" });
    const fallbackDescription = readCopy(t, "meta.description", { defaultValue: "" });
    return {
      title: readCopy(t, "meta.defaultTitle", {
        defaultValue: fallbackTitle,
      }),
      description: readCopy(t, "meta.defaultDescription", {
        defaultValue: fallbackDescription,
      }),
      state: "expired",
    };
  }

  const percentLabel = formatPercent(lang, candidate.discountPct);
  const start = isoDateToLocalStart(candidate.startDate);
  const end = isoDateToLocalStart(candidate.endDate);
  const includeYear = shouldIncludeYear(now, start, end);
  const from = formatMonthDay(lang, start, { includeYear });
  const to = formatMonthDay(lang, end, { includeYear });

  const state: DealsMetadataState = activeDeal ? "active" : "upcoming";

  const title = readCopy(t, "meta.activeTitle", {
    percent: percentLabel,
    from,
    to,
    defaultValue: readCopy(t, "meta.title", {
      percent: percentLabel,
      from,
      to,
      defaultValue: "",
    }),
  });
  const description = readCopy(t, "meta.activeDescription", {
    percent: percentLabel,
    from,
    to,
    defaultValue: readCopy(t, "meta.description", {
      percent: percentLabel,
      from,
      to,
      defaultValue: "",
    }),
  });

  return { title, description, state };
};
