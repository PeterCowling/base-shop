export type RemovalType = "SAFE_DROP" | "BANK_DROP" | "LIFT";
export type RemovalDestination = "SAFE" | "BANK";

export interface TenderRemovalRecord {
  amount: number;
  removalType: RemovalType;
  destination?: RemovalDestination;
}

export interface FloatEntry {
  amount: number;
  userId: string;
  createdAt: string; // ISO timestamp
}

export const SAFE_DROP_THRESHOLD = 500;
