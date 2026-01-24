export interface KeycardTransfer {
  user: string;
  timestamp: string;
  count: number;
  direction: "fromSafe" | "toSafe";
  shiftId?: string;
}

export type KeycardTransfers = Record<string, KeycardTransfer> | null;
