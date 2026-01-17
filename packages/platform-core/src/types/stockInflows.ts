export type StockInflowReportItem = {
  sku: string;
  productId?: string;
  variantAttributes: Record<string, string>;
  delta: number;
  previousQuantity: number;
  nextQuantity: number;
};

export type StockInflowReport = {
  created: number;
  updated: number;
  items: StockInflowReportItem[];
};

export type StockInflowEvent = {
  id: string;
  receivedAt: string;
  note?: string;
  report: StockInflowReport;
  items: StockInflowReportItem[];
};
