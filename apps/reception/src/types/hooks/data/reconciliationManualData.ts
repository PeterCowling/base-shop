export interface ManualPmsPosting {
  amount: number;
  method: "CASH" | "CC";
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface ManualTerminalBatch {
  amount: number;
  createdAt: string;
  createdBy: string;
  note?: string;
}

export type ManualPmsPostings = Record<string, ManualPmsPosting> | null;
export type ManualTerminalBatches = Record<string, ManualTerminalBatch> | null;