// src/types/hooks/data/cashCountData.ts

import type {
  CashCount as CashCountSchema,
  CashCounts as CashCountsSchema,
} from "../../../schemas/cashCountSchema";

export type CashCountType = CashCountSchema["type"];
export type CashCount = CashCountSchema;
export type CashCounts = CashCountsSchema;
