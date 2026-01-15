import type { FC } from "react";
import type { Transaction } from "../../types/component/Till";
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
  showFloatForm: boolean;
  showExchangeForm: boolean;
  showTenderRemovalForm: boolean;
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
    breakdown: Record<string, number>
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
  setShowFloatForm: (val: boolean) => void;
  setShowExchangeForm: (val: boolean) => void;
  setShowTenderRemovalForm: (val: boolean) => void;
}

const FormsContainer: FC<FormsContainerProps> = (props) => {
  const {
    shiftOpenTime,
    showOpenShiftForm,
    showCloseShiftForm,
    closeShiftFormVariant,
    showKeycardCountForm,
    showFloatForm,
    showExchangeForm,
    showTenderRemovalForm,
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
    setShowFloatForm,
    setShowExchangeForm,
    setShowTenderRemovalForm,
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
      {showFloatForm && shiftOpenTime && (
        <FloatEntryModal
          onConfirm={confirmFloat}
          onClose={() => setShowFloatForm(false)}
        />
      )}
      {showExchangeForm && shiftOpenTime && (
        <ExchangeNotesForm
          onConfirm={confirmExchange}
          onCancel={() => setShowExchangeForm(false)}
        />
      )}
      {showCloseShiftForm && shiftOpenTime && (
        <CloseShiftForm
          ccTransactionsFromThisShift={ccTransactionsFromThisShift}
          onConfirm={(cash, keys, receipts, breakdown) =>
            confirmShiftClose(
              closeShiftFormVariant,
              cash,
              keys,
              receipts,
              breakdown
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
      {showTenderRemovalForm && shiftOpenTime && (
        <TenderRemovalModal
          onConfirm={handleTenderRemoval}
          onClose={() => setShowTenderRemovalForm(false)}
        />
      )}
    </>
  );
};

export default FormsContainer;
