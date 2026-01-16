export type StockAdjustmentReason =
  | "correction"
  | "damage"
  | "shrinkage"
  | "return_to_stock"
  | "manual_recount"
  | string;

export type StockAdjustmentReportItem = {
  sku: string;
  productId?: string;
  variantAttributes: Record<string, string>;
  delta: number;
  previousQuantity: number;
  nextQuantity: number;
  reason: StockAdjustmentReason;
};

export type StockAdjustmentReport = {
  created: number;
  updated: number;
  items: StockAdjustmentReportItem[];
};

export type StockAdjustmentEvent = {
  id: string;
  adjustedAt: string;
  note?: string;
  report: StockAdjustmentReport;
  items: StockAdjustmentReportItem[];
};
