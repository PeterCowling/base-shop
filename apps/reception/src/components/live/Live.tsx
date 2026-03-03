"use client";

import { memo } from "react";

import { TillDataProvider } from "../../context/TillDataContext";
import { useTillReconciliationUI } from "../../hooks/client/till/useTillReconciliationUI";
import { useTillReconciliationLogic } from "../../hooks/useTillReconciliationLogic";
import { canAccess, Permissions } from "../../lib/roles";
import type { User } from "../../types/domains/userDomain";
import { PageShell } from "../common/PageShell";
import SummaryAndTransactions from "../till/SummaryAndTransactions";

function LiveInner() {
  const ui = useTillReconciliationUI();
  const logic = useTillReconciliationLogic(ui);
  const props = { ...ui, ...logic };

  if (!props.user || !canAccess(props.user as User, Permissions.REALTIME_DASHBOARD)) {
    return (
      <PageShell title="LIVE SHIFT">
        <p className="text-error-main">Not authorized.</p>
      </PageShell>
    );
  }

  if (!props.shiftOpenTime) {
    return (
      <PageShell title="LIVE SHIFT">
        <p className="text-muted-foreground">No shift is currently open.</p>
      </PageShell>
    );
  }

  return (
    <PageShell title="LIVE SHIFT">
      <div className="bg-surface rounded-lg shadow-lg p-6 space-y-8">
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
