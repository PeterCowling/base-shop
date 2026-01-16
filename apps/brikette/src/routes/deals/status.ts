import type { DealConfig } from "./deals";
import { isoDateToLocalEndInclusive, isoDateToLocalStart } from "./dates";

export type DealStatus = "upcoming" | "active" | "expired";

export const getDealStatus = (
  deal: Pick<DealConfig, "startDate" | "endDate">,
  now: Date = new Date(),
): DealStatus => {
  const start = isoDateToLocalStart(deal.startDate);
  const end = isoDateToLocalEndInclusive(deal.endDate);

  if (now < start) return "upcoming";
  if (now > end) return "expired";
  return "active";
};

