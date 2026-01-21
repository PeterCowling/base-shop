export interface CCReceiptIrregularity {
  user: string;
  timestamp: string;
  action: "reconcile" | "close";
  missingCount: number;
}

export type CCReceiptIrregularities = Record<
  string,
  CCReceiptIrregularity
> | null;
