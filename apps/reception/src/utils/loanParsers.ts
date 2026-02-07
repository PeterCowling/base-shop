import { type LoanItem, type LoanMethod, type TxType } from "../types/hooks/data/loansData";

/**
 * Helper to parse raw string into our strict LoanItem.
 * Fallback is "No_card" if unrecognized.
 */
export function parseLoanItem(input?: string): LoanItem {
  const normalized = (input ?? "").trim().toLowerCase();
  switch (normalized) {
    case "hairdryer":
      return "Hairdryer";
    case "steamer":
      return "Steamer";
    case "padlock":
      return "Padlock";
    case "keycard":
      return "Keycard";
    default:
      return "No_card";
  }
}

/**
 * Helper to parse raw string into our strict TxType.
 * Fallback is "Loan" if unrecognized.
 */
export function parseTxType(input?: string): TxType {
  const normalized = (input ?? "").trim().toLowerCase();
  switch (normalized) {
    case "refund":
      return "Refund";
    case "no_card":
      return "No_Card";
    default:
      return "Loan";
  }
}

/**
 * Helper to parse raw string into our strict LoanMethod.
 * Fallback is "NO_CARD" if unrecognized.
 */
export function parseLoanMethod(input?: string): LoanMethod {
  const normalized = (input ?? "").trim().toUpperCase();
  switch (normalized) {
    case "CASH":
      return "CASH";
    case "PASSPORT":
      return "PASSPORT";
    case "LICENSE":
      return "LICENSE";
    case "ID":
      return "ID";
    default:
      return "NO_CARD";
  }
}
