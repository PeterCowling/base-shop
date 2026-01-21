// src/types/hooks/data/cashDiscrepancyData.ts

export interface CashDiscrepancy {
  user: string;
  timestamp: string;
  amount: number;
}

export type CashDiscrepancies = Record<string, CashDiscrepancy> | null;
