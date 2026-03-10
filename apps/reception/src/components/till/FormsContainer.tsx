import type { FC } from "react";

import type { TillCashForm } from "../../hooks/client/till/useTillReconciliationUI";
import type { Transaction, VarianceSignoff } from "../../types/component/Till";
import type { TenderRemovalRecord } from "../../types/finance";

import { CloseShiftForm } from "./CloseShiftForm";
import { ExchangeNotesForm } from "./ExchangeNotesForm";
import { FloatEntryModal } from "./FloatEntryModal";
import { KeycardCountForm } from "./KeycardCountForm";
import { OpenShiftForm } from "./OpenShiftForm";
import { TenderRemovalModal } from "./TenderRemovalModal";

interface FormsContainerProps {
  shiftOpenTime: Date | null;
  showOpenShiftForm: boolean;
  showCloseShiftForm: boolean;
  closeShiftFormVariant: "close" | "reconcile";
  showKeycardCountForm: boolean;
  cashForm: TillCashForm;
  setCashForm: (v: TillCashForm) => void;
  pinRequiredForTenderRemoval: boolean;
  lastCloseCashCount: number;
  expectedCashAtClose: number;
  expectedKeycardsAtClose: number;
  ccTransactionsFromLastShift: Transaction[];
  ccTransactionsFromThisShift: Transaction[];
  confirmShiftOpen: (
    calculatedCash: number,
    allReceiptsConfirmed: boolean,
    openingKeycards?: number,
    breakdown?: Record<string, number>
  ) => void;
  confirmShiftClose: (
    action: "close" | "reconcile",
    countedCash: number,
    countedKeycards: number,
    allReceiptsConfirmed: boolean,
    breakdown: Record<string, number>,
    varianceSignoff?: VarianceSignoff,
    varianceSignoffRequired?: boolean
  ) => void;
  confirmKeycardReconcile: (counted: number) => void;
  confirmFloat: (amount: number) => Promise<void>;
  confirmExchange: (
    outgoing: Record<string, number>,
    incoming: Record<string, number>,
    direction: "drawerToSafe" | "safeToDrawer",
    total: number
  ) => Promise<void>;
  handleTenderRemoval: (rec: TenderRemovalRecord) => Promise<void>;
  setShowOpenShiftForm: (val: boolean) => void;
  setShowCloseShiftForm: (val: boolean) => void;
  setShowKeycardCountForm: (val: boolean) => void;
}

const FormsContainer: FC<FormsContainerProps> = (props) => {
  const {
    shiftOpenTime,
    showOpenShiftForm,
    showCloseShiftForm,
    closeShiftFormVariant,
    showKeycardCountForm,
    cashForm,
    setCashForm,
    pinRequiredForTenderRemoval,
    lastCloseCashCount,
    expectedCashAtClose,
    expectedKeycardsAtClose,
    ccTransactionsFromLastShift,
    ccTransactionsFromThisShift,
    confirmShiftOpen,
    confirmShiftClose,
    confirmKeycardReconcile,
    confirmFloat,
    confirmExchange,
    handleTenderRemoval,
    setShowOpenShiftForm,
    setShowCloseShiftForm,
    setShowKeycardCountForm,
  } = props;

  return (
    <>
      {showOpenShiftForm && !shiftOpenTime && (
        <OpenShiftForm
          ccTransactionsFromLastShift={ccTransactionsFromLastShift}
          onConfirm={confirmShiftOpen}
          onCancel={() => setShowOpenShiftForm(false)}
          previousFinalCash={lastCloseCashCount}
        />
      )}
      {cashForm === "float" && shiftOpenTime && (
        <FloatEntryModal
          onConfirm={confirmFloat}
          onClose={() => setCashForm("none")}
        />
      )}
      {cashForm === "exchange" && shiftOpenTime && (
        <ExchangeNotesForm
          onConfirm={confirmExchange}
          onCancel={() => setCashForm("none")}
        />
      )}
      {showCloseShiftForm && shiftOpenTime && (
        <CloseShiftForm
          ccTransactionsFromThisShift={ccTransactionsFromThisShift}
          onConfirm={(cash, keys, receipts, breakdown, signoff, signoffRequired) =>
            confirmShiftClose(
              closeShiftFormVariant,
              cash,
              keys,
              receipts,
              breakdown,
              signoff,
              signoffRequired
            )
          }
          onCancel={() => setShowCloseShiftForm(false)}
          expectedCashAtClose={expectedCashAtClose}
          expectedKeycardsAtClose={expectedKeycardsAtClose}
          variant={closeShiftFormVariant}
        />
      )}
      {showKeycardCountForm && shiftOpenTime && (
        <KeycardCountForm
          expectedCount={expectedKeycardsAtClose}
          onConfirm={confirmKeycardReconcile}
          onCancel={() => setShowKeycardCountForm(false)}
        />
      )}
      {cashForm === "tenderRemoval" && shiftOpenTime && (
        <TenderRemovalModal
          onConfirm={handleTenderRemoval}
          onClose={() => setCashForm("none")}
          pinRequiredForTenderRemoval={pinRequiredForTenderRemoval}
        />
      )}
    </>
  );
};

export default FormsContainer;
