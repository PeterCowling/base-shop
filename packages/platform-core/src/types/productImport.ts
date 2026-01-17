export type ProductImportStatus =
  | "created"
  | "updated"
  | "skipped"
  | "error"
  | "unchanged"
  | string;

export type ProductImportReportItem = {
  sku: string;
  title?: string;
  status?: ProductImportStatus;
  message?: string;
  errors?: string[];
  warnings?: string[];
};

export type ProductImportReport = {
  dryRun: boolean;
  created?: number;
  updated?: number;
  skipped?: number;
  errors: number;
  warnings?: number;
  items?: ProductImportReportItem[];
};

export type ProductImportEvent = {
  id: string;
  receivedAt: string;
  note?: string;
  report: ProductImportReport;
  items: ProductImportReportItem[];
};
