// src/types/hooks/data/safeCountData.ts

import type {
  SafeCount as SafeCountSchema,
  SafeCounts as SafeCountsSchema,
} from "../../../schemas/safeCountSchema";

export type SafeCountType = SafeCountSchema["type"];

export type SafeCount = SafeCountSchema & { id?: string };

export type SafeCounts = SafeCountsSchema;
