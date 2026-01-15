/* src/types/hooks/data/cardIrregularityData.ts */

export interface CardIrregularity {
  user: string;
  timestamp: string;
  action: "reconcile" | "close";
  missingCount: number;
}

export type CardIrregularities = Record<string, CardIrregularity> | null;
