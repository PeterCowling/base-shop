"use client";

import { memo } from "react";

import { TillDataProvider } from "../../context/TillDataContext";
import { useTillReconciliationUI } from "../../hooks/client/till/useTillReconciliationUI";
import { useTillReconciliationLogic } from "../../hooks/useTillReconciliationLogic";
import SummaryAndTransactions from "../till/SummaryAndTransactions";

function LiveInner() {
  const ui = useTillReconciliationUI();
  const logic = useTillReconciliationLogic(ui);
  const props = { ...ui, ...logic };

  if (!props.user || props.user.user_name !== "Pete") {
    return <p className="p-5 text-error-main">Not authorized.</p>;
  }

  if (!props.shiftOpenTime) {
    return <p className="p-5">No shift is currently open.</p>;
  }

  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        LIVE SHIFT
      </h1>
      <div className="bg-white rounded-lg shadow p-6 space-y-8 dark:bg-darkSurface">
        <SummaryAndTransactions
          shiftOpenTime={props.shiftOpenTime}
          shiftOwner={props.shiftOwner}
          openingCash={props.openingCash}
          openingKeycards={props.openingKeycards}
          finalCashCount={props.finalCashCount}
          finalKeycardCount={props.finalKeycardCount}
          netCash={props.netCash}
          creditSlipTotal={props.creditSlipTotal}
          netCC={props.netCC}
          docDepositsCount={props.docDepositsCount}
          docReturnsCount={props.docReturnsCount}
          keycardsLoaned={props.keycardsLoaned}
          keycardsReturned={props.keycardsReturned}
          expectedKeycardsAtClose={props.expectedKeycardsAtClose}
          expectedCashAtClose={props.expectedCashAtClose}
          filteredTransactions={props.filteredTransactions}
          isDeleteMode={props.isDeleteMode}
          isEditMode={props.isEditMode}
          handleRowClickForDelete={props.handleRowClickForDelete}
          handleRowClickForEdit={props.handleRowClickForEdit}
        />
      </div>
    </div>
  );
}

const Live = () => (
  <TillDataProvider>
    <LiveInner />
  </TillDataProvider>
);

export default memo(Live);
