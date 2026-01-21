import { useTillShiftContext } from "./TillShiftProvider";

export function useTillTransactions() {
  const till = useTillShiftContext();
  return {
    filteredTransactions: till.filteredTransactions,
    creditSlipTotal: till.creditSlipTotal,
    netCash: till.netCash,
    netCC: till.netCC,
    docDepositsCount: till.docDepositsCount,
    docReturnsCount: till.docReturnsCount,
    keycardsLoaned: till.keycardsLoaned,
    keycardsReturned: till.keycardsReturned,
    ccTransactionsFromLastShift: till.ccTransactionsFromLastShift,
    ccTransactionsFromThisShift: till.ccTransactionsFromThisShift,
  } as const;
}
