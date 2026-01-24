export type VoidableTransaction = {
  voidedAt?: string;
  voidedBy?: string;
  voidedByUid?: string;
  voidReason?: string;
  voidedShiftId?: string;
};

export type CorrectableTransaction = {
  sourceTxnId?: string;
  correctionReason?: string;
  correctionKind?: string;
  correctedBy?: string;
  correctedByUid?: string;
  correctedShiftId?: string;
};

export function isVoidedTransaction(txn: VoidableTransaction): boolean {
  return Boolean(
    txn.voidedAt ||
      txn.voidedBy ||
      txn.voidedByUid ||
      txn.voidReason ||
      txn.voidedShiftId
  );
}

export function isCorrectionTransaction(txn: CorrectableTransaction): boolean {
  return Boolean(
    txn.sourceTxnId ||
      txn.correctionReason ||
      txn.correctionKind ||
      txn.correctedBy ||
      txn.correctedByUid ||
      txn.correctedShiftId
  );
}
