// src/components/till/TillReconciliation.tsx

import { memo } from "react";
import { useTillReconciliationLogic } from "../../hooks/useTillReconciliationLogic";
import { useTillReconciliationUI } from "../../hooks/client/till/useTillReconciliationUI";
import ActionButtons from "./ActionButtons";
import DrawerLimitWarning from "./DrawerLimitWarning";
import FormsContainer from "./FormsContainer";
import TransactionModals from "./TransactionModals";
import AddKeycardsModal from "./AddKeycardsModal";
import ReturnKeycardsModal from "./ReturnKeycardsModal";

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

  if (!props.user) {
    return (
      <p className="p-5 text-error-main">Not authorized. Please log in.</p>
    );
  }

  return (
    <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
      <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
        TILL MANAGEMENT
      </h1>
      <div className="flex-grow bg-white rounded-lg shadow p-6 space-y-8 dark:bg-darkSurface">
        <DrawerLimitWarning
          show={props.isDrawerOverLimit}
          onLift={props.handleLiftClick}
        />
        <ActionButtons
          shiftOpenTime={props.shiftOpenTime}
          isTillOverMax={props.isTillOverMax}
          isDrawerOverLimit={props.isDrawerOverLimit}
          userName={props.user.user_name}
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
        {props.isEditMode && (
          <div className="text-blue-600 text-sm font-semibold text-center">
            Click a row to edit the transaction
          </div>
        )}
        {props.isDeleteMode && (
          <div className="text-red-600 text-sm font-semibold text-center">
            Click a row to delete the transaction
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
      </div>
    </div>
  );
}

export default memo(TillReconciliation);
