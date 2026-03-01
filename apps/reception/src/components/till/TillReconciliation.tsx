// src/components/till/TillReconciliation.tsx

import { memo } from "react";
import { AlertTriangle, Info } from "lucide-react";

import { useTillReconciliationUI } from "../../hooks/client/till/useTillReconciliationUI";
import { useCashCountsData } from "../../hooks/data/useCashCountsData";
import { useTillReconciliationLogic } from "../../hooks/useTillReconciliationLogic";
import { endOfDayIso, sameItalyDate, startOfDayIso } from "../../utils/dateUtils";
import { PageShell } from "../common/PageShell";

import ActionButtons from "./ActionButtons";
import AddKeycardsModal from "./AddKeycardsModal";
import DrawerLimitWarning from "./DrawerLimitWarning";
import DrawerOverrideModal from "./DrawerOverrideModal";
import FormsContainer from "./FormsContainer";
import ReturnKeycardsModal from "./ReturnKeycardsModal";
import TillShiftHistory from "./TillShiftHistory";
import TransactionModals from "./TransactionModals";

/**
 * Main Till component:
 * - Manages opening/closing a shift (till)
 * - Prevents multiple concurrent openings in the database
 * - Displays the most recent closing count on opening
 * - Calculates differences between opening and closing amounts
 * - Passes credit card (CC) transactions from the previous shift
 *   and requires confirmation before opening/closing
 * - Displays a summary of the current open shift
 */
function TillReconciliation(): JSX.Element {
  const ui = useTillReconciliationUI();
  const logic = useTillReconciliationLogic(ui);
  const props = { ...logic, ...ui };

  const { cashCounts } = useCashCountsData({
    orderByChild: "timestamp",
    startAt: startOfDayIso(new Date()),
    endAt: endOfDayIso(new Date()),
  });
  const floatDoneToday = cashCounts.some(
    (c) => c.type === "openingFloat" && sameItalyDate(c.timestamp, new Date())
  );

  if (!props.user) {
    return (
      <p className="p-5 text-danger-fg">Not authorized. Please log in.</p>
    );
  }

  return (
    <PageShell title="TILL MANAGEMENT">
      <div className="flex-grow bg-surface rounded-lg shadow-lg p-6 space-y-8">
        <DrawerLimitWarning
          show={props.isDrawerOverLimit}
          onLift={props.handleLiftClick}
        />
        <ActionButtons
          shiftOpenTime={props.shiftOpenTime}
          isTillOverMax={props.isTillOverMax}
          isDrawerOverLimit={props.isDrawerOverLimit}
          user={props.user}
          drawerLimitInput={props.drawerLimitInput}
          setDrawerLimitInput={props.setDrawerLimitInput}
          updateLimit={props.updateLimit}
          handleOpenShiftClick={props.handleOpenShiftClick}
          handleKeycardCountClick={props.handleKeycardCountClick}
          handleCloseShiftClick={props.handleCloseShiftClick}
          handleAddChangeClick={props.handleAddChangeClick}
          handleExchangeClick={props.handleExchangeClick}
          handleAddKeycard={props.handleAddKeycard}
          handleReturnKeycard={props.handleReturnKeycard}
          handleLiftClick={props.handleLiftClick}
        />
        {props.shiftOpenTime === null && !floatDoneToday && (
          <div
            className="bg-warning/10 border border-warning rounded-lg px-4 py-3 flex items-center gap-3"
            data-cy="float-nudge-banner"
          >
            <AlertTriangle className="text-warning shrink-0" size={16} aria-hidden="true" />
            <span className="text-foreground text-sm font-semibold">
              Opening float not set —{" "}
              <a
                href="/eod-checklist/"
                className="underline hover:opacity-80"
                data-cy="float-nudge-link"
              >
                Go to EOD checklist →
              </a>
            </span>
          </div>
        )}
        {props.isEditMode && (
          <div className="bg-primary-soft border border-primary-main/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <Info className="text-primary-main shrink-0" size={16} aria-hidden="true" />
            <span className="text-foreground text-sm font-semibold">
              Click a row to edit the transaction
            </span>
          </div>
        )}
        {props.isDeleteMode && (
          <div className="bg-warning/10 border border-warning rounded-lg px-4 py-3 flex items-center gap-3">
            <AlertTriangle className="text-warning shrink-0" size={16} aria-hidden="true" />
            <span className="text-foreground text-sm font-semibold">
              Click a row to void the transaction
            </span>
          </div>
        )}
        <FormsContainer
          shiftOpenTime={props.shiftOpenTime}
          showOpenShiftForm={props.showOpenShiftForm}
          showCloseShiftForm={props.showCloseShiftForm}
          closeShiftFormVariant={props.closeShiftFormVariant}
          showKeycardCountForm={props.showKeycardCountForm}
          showFloatForm={props.showFloatForm}
          showExchangeForm={props.showExchangeForm}
          showTenderRemovalForm={props.showTenderRemovalForm}
          pinRequiredForTenderRemoval={props.pinRequiredForTenderRemoval}
          lastCloseCashCount={props.lastCloseCashCount}
          expectedCashAtClose={props.expectedCashAtClose}
          expectedKeycardsAtClose={props.expectedKeycardsAtClose}
          ccTransactionsFromLastShift={props.ccTransactionsFromLastShift}
          ccTransactionsFromThisShift={props.ccTransactionsFromThisShift}
          confirmShiftOpen={props.confirmShiftOpen}
          confirmShiftClose={props.confirmShiftClose}
          confirmKeycardReconcile={props.confirmKeycardReconcile}
          confirmFloat={props.confirmFloat}
          confirmExchange={props.confirmExchange}
          handleTenderRemoval={props.handleTenderRemoval}
          setShowOpenShiftForm={props.setShowOpenShiftForm}
          setShowCloseShiftForm={props.setShowCloseShiftForm}
          setShowKeycardCountForm={props.setShowKeycardCountForm}
          setShowFloatForm={props.setShowFloatForm}
          setShowExchangeForm={props.setShowExchangeForm}
          setShowTenderRemovalForm={props.setShowTenderRemovalForm}
        />
        <TransactionModals
          txnToDelete={props.txnToDelete}
          txnToEdit={props.txnToEdit}
          setTxnToDelete={props.setTxnToDelete}
          setTxnToEdit={props.setTxnToEdit}
        />
        <TillShiftHistory />
        {props.showAddKeycardModal && (
          <AddKeycardsModal
            onConfirm={props.confirmAddKeycard}
            onCancel={props.cancelAddKeycard}
          />
        )}
        {props.showReturnKeycardModal && (
          <ReturnKeycardsModal
            onConfirm={props.confirmReturnKeycard}
            onCancel={props.cancelReturnKeycard}
          />
        )}
        {props.showDrawerOverrideModal && (
          <DrawerOverrideModal
            shiftOwnerName={props.shiftOwner ?? ""}
            onConfirm={props.confirmDrawerOverride}
            onCancel={props.cancelDrawerOverride}
          />
        )}
      </div>
    </PageShell>
  );
}

export default memo(TillReconciliation);
