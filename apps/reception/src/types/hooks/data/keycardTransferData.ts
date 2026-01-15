export interface KeycardTransfer {
  user: string;
  timestamp: string;
  count: number;
  direction: "fromSafe" | "toSafe";
}

export type KeycardTransfers = Record<string, KeycardTransfer> | null;
