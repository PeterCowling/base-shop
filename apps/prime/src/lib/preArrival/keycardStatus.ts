import type { LoanOccupantRecord, LoanTransaction, TxType } from '../../types/loans';

export type GuestKeycardStatusState = 'issued' | 'pending-issue' | 'lost';

export interface GuestKeycardStatus {
  state: GuestKeycardStatusState;
  hasLostCardNotice: boolean;
  latestTransactionType: TxType | null;
  latestTransactionAt: string | null;
}

const KEYCARD_ITEM_PATTERN = /key\s*card/i;

function toTransactionTimestamp(createdAt: string): number {
  const parsed = Date.parse(createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isKeycardTransaction(transaction: LoanTransaction): boolean {
  if (transaction.type === 'no_card') {
    return true;
  }

  return KEYCARD_ITEM_PATTERN.test(transaction.item ?? '');
}

function getLatestKeycardTransaction(loans: LoanOccupantRecord | null | undefined): LoanTransaction | null {
  const transactions = loans?.txns ? Object.values(loans.txns) : [];

  if (transactions.length === 0) {
    return null;
  }

  const keycardTransactions = transactions.filter(isKeycardTransaction);
  if (keycardTransactions.length === 0) {
    return null;
  }

  keycardTransactions.sort((a, b) => {
    return toTransactionTimestamp(b.createdAt) - toTransactionTimestamp(a.createdAt);
  });

  return keycardTransactions[0];
}

export function deriveGuestKeycardStatus(loans: LoanOccupantRecord | null | undefined): GuestKeycardStatus {
  const latestTransaction = getLatestKeycardTransaction(loans);

  if (!latestTransaction) {
    return {
      state: 'pending-issue',
      hasLostCardNotice: false,
      latestTransactionType: null,
      latestTransactionAt: null,
    };
  }

  if (latestTransaction.type === 'no_card') {
    return {
      state: 'lost',
      hasLostCardNotice: true,
      latestTransactionType: latestTransaction.type,
      latestTransactionAt: latestTransaction.createdAt,
    };
  }

  if (latestTransaction.type === 'loan') {
    return {
      state: 'issued',
      hasLostCardNotice: false,
      latestTransactionType: latestTransaction.type,
      latestTransactionAt: latestTransaction.createdAt,
    };
  }

  return {
    state: 'pending-issue',
    hasLostCardNotice: false,
    latestTransactionType: latestTransaction.type,
    latestTransactionAt: latestTransaction.createdAt,
  };
}
