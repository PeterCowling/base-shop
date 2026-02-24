"use client";

import { memo } from "react";

import { TillDataProvider } from "../../context/TillDataContext";
import { useTillReconciliationUI } from "../../hooks/client/till/useTillReconciliationUI";
import { useTillReconciliationLogic } from "../../hooks/useTillReconciliationLogic";
import { PageShell } from "../common/PageShell";
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
    <PageShell title="LIVE SHIFT">
      <div className="bg-surface rounded-lg shadow p-6 space-y-8">
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
    </PageShell>
  );
}

const Live = () => (
  <TillDataProvider>
    <LiveInner />
  </TillDataProvider>
);

export default memo(Live);
