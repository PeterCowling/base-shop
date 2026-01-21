export interface CCReceiptConfirmation {
  user: string;
  timestamp: string;
}

export type CCReceiptConfirmations = Record<
  string,
  CCReceiptConfirmation
> | null;
