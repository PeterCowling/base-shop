// src/types/keycards.ts

export enum KeycardPayType {
  CASH = "CASH",
  DOCUMENT = "DOCUMENT",
  NO_CARD = "NO_CARD",
  // Or remove CARD/NONE if you don’t need them
  // CARD = "CARD",
  // NONE = "NONE",
}

export enum DocumentType {
  PASSPORT = "PASSPORT",
  DRIVING_LICENSE = "DRIVING_LICENSE",
  ID_CARD = "ID_CARD",
  OTHER = "OTHER",
}

export interface KeycardIssuePayload {
  bookingRef: string;
  occupantId: string;
  payType: KeycardPayType;
  cardCount: number;
  docType: DocumentType;
}

/* ------------------------------------------------------------------ */
/* Helper functions to convert between UI selections and LoanMethod   */
/* ------------------------------------------------------------------ */
import { LoanMethod } from "./hooks/data/loansData";

/**
 * Convert a pair of UI selections (payType & docType) into the LoanMethod used
 * by the data layer.
 */
export function selectionToLoanMethod(
  payType: KeycardPayType,
  docType: DocumentType
): LoanMethod {
  if (payType === KeycardPayType.CASH) return "CASH";
  if (payType === KeycardPayType.NO_CARD) return "NO_CARD";
  switch (docType) {
    case DocumentType.PASSPORT:
      return "PASSPORT";
    case DocumentType.DRIVING_LICENSE:
      return "LICENSE";
    case DocumentType.ID_CARD:
    default:
      return "ID";
  }
}

/**
 * Given a LoanMethod from the data layer, return the corresponding UI
 * selections. The docType value is only meaningful when the resulting payType
 * is DOCUMENT.
 */
export function loanMethodToSelection(method: LoanMethod): {
  payType: KeycardPayType;
  docType: DocumentType;
} {
  switch (method) {
    case "CASH":
      return { payType: KeycardPayType.CASH, docType: DocumentType.PASSPORT };
    case "PASSPORT":
      return {
        payType: KeycardPayType.DOCUMENT,
        docType: DocumentType.PASSPORT,
      };
    case "LICENSE":
      return {
        payType: KeycardPayType.DOCUMENT,
        docType: DocumentType.DRIVING_LICENSE,
      };
    case "ID":
      return {
        payType: KeycardPayType.DOCUMENT,
        docType: DocumentType.ID_CARD,
      };
    case "NO_CARD":
    default:
      return {
        payType: KeycardPayType.NO_CARD,
        docType: DocumentType.PASSPORT,
      };
  }
}
