import type { FC } from "react";
import type { Transaction } from "../../types/component/Till";
import { ShiftSummary } from "./ShiftSummary";
import TransactionTable from "./TransactionTable";

interface SummaryAndTransactionsProps {
  shiftOpenTime: Date | null;
  shiftOwner: string | null;
  openingCash: number;
  openingKeycards: number;
  finalCashCount: number;
  finalKeycardCount: number;
  netCash: number;
  creditSlipTotal: number;
  netCC: number;
  docDepositsCount: number;
  docReturnsCount: number;
  keycardsLoaned: number;
  keycardsReturned: number;
  expectedKeycardsAtClose: number;
  expectedCashAtClose: number;
  filteredTransactions: Transaction[];
  isDeleteMode: boolean;
  isEditMode: boolean;
  handleRowClickForDelete: (txn: Transaction) => void;
  handleRowClickForEdit: (txn: Transaction) => void;
}

const SummaryAndTransactions: FC<SummaryAndTransactionsProps> = ({
  shiftOpenTime,
  shiftOwner,
  openingCash,
  openingKeycards,
  finalCashCount,
  finalKeycardCount,
  netCash,
  creditSlipTotal,
  netCC,
  docDepositsCount,
  docReturnsCount,
  keycardsLoaned,
  keycardsReturned,
  expectedKeycardsAtClose,
  expectedCashAtClose,
  filteredTransactions,
  isDeleteMode,
  isEditMode,
  handleRowClickForDelete,
  handleRowClickForEdit,
}) => {
  if (!shiftOpenTime) return null;
  return (
    <>
      <ShiftSummary
        shiftOpenTime={shiftOpenTime}
        shiftOwner={shiftOwner}
        openingCash={openingCash}
        openingKeycards={openingKeycards}
        finalCashCount={finalCashCount}
        finalKeycardCount={finalKeycardCount}
        netCash={netCash}
        creditSlipTotal={creditSlipTotal}
        netCC={netCC}
        docDepositsCount={docDepositsCount}
        docReturnsCount={docReturnsCount}
        keycardsLoaned={keycardsLoaned}
        keycardsReturned={keycardsReturned}
        expectedKeycardsAtClose={expectedKeycardsAtClose}
        expectedCashAtClose={expectedCashAtClose}
      />
      <div className="overflow-x-auto">
        {filteredTransactions.length > 0 && (
          <TransactionTable
            transactions={filteredTransactions}
            shiftOwner={shiftOwner}
            isDeleteMode={isDeleteMode}
            isEditMode={isEditMode}
            onRowDelete={handleRowClickForDelete}
            onRowEdit={handleRowClickForEdit}
          />
        )}
      </div>
    </>
  );
};

export default SummaryAndTransactions;
