export interface KeycardDiscrepancy {
  user: string;
  timestamp: string;
  amount: number;
}

export type KeycardDiscrepancies = Record<string, KeycardDiscrepancy> | null;
