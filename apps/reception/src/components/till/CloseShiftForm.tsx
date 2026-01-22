/* src/components/till/CloseShiftForm.tsx */

import { memo, useCallback, useEffect, useMemo,useRef, useState } from "react";
import { z } from "zod";

import { DISCREPANCY_LIMIT } from "../../constants/cash";
import { settings } from "../../constants/settings";
import { useAuth } from "../../context/AuthContext";
import useShiftProgress, {
  type ShiftProgress,
  useAutoSaveShiftProgress,
} from "../../hooks/utilities/useShiftProgress";
import { type CloseShiftFormProps } from "../../types/component/Till";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import PinEntryModal from "../common/PinEntryModal";

import { CreditCardReceiptCheck } from "./CreditCardReceiptCheck";
import { KeycardCountForm } from "./KeycardCountForm";
import StepProgress from "./StepProgress";

const calcBreakdownTotal = (breakdown: Record<string, number>): number =>
  Object.entries(breakdown).reduce(
    (sum, [denom, count]) => sum + Number(denom) * count,
    0
  );

const closeShiftFormSchema = z
  .object({
    cash: z.number().min(0),
    keycards: z.number().int().min(0),
    breakdown: z.record(z.number().int().min(0)),
    receiptsConfirmed: z.boolean(),
  })
  .refine((data) => calcBreakdownTotal(data.breakdown) === data.cash, {
    message: "Cash total does not match breakdown",
    path: ["cash"],
  });
/**
 * Form to close a shift:
 * - Count denominations for the final cash
 * - Confirm credit card receipts for the current shift
 */
export const CloseShiftForm = memo(function CloseShiftForm({
  variant = "close",
  ccTransactionsFromThisShift,
  expectedCashAtClose,
  expectedKeycardsAtClose,
  onConfirm,
  onCancel,
}: CloseShiftFormProps) {
  const isReconcile = variant === "reconcile";
  const STORAGE_KEY = isReconcile
    ? "reconcile-shift-progress"
    : "close-shift-progress";
  const progressStore = useShiftProgress(STORAGE_KEY);

  const saved = progressStore.load();

  const [step, setStep] = useState(saved?.step ?? 0);
  const [receiptMap, setReceiptMap] = useState<Record<string, boolean>>(
    saved?.receipts ?? {}
  );
  const hasCCReceipts = ccTransactionsFromThisShift.length > 0;
  const [allReceiptsConfirmed, setAllReceiptsConfirmed] = useState<boolean>(
    hasCCReceipts ? false : true
  );

  const { user } = useAuth();

  const [recountRequired, setRecountRequired] = useState(false);
  const [countedCash, setCountedCash] = useState(saved?.cash ?? 0);
  const [countedKeycards, setCountedKeycards] = useState(saved?.keycards ?? 0);
  const [denomBreakdown, setDenomBreakdown] = useState<Record<string, number>>({});

  const diff = countedCash - expectedCashAtClose;

  const [showPinModal, setShowPinModal] = useState(false);


  const finishConfirm = () => {
    progressStore.clear();
    onConfirm(countedCash, countedKeycards, allReceiptsConfirmed, denomBreakdown);
  };

  const handleConfirm = () => {
    const validation = closeShiftFormSchema.safeParse({
      cash: countedCash,
      keycards: countedKeycards,
      breakdown: denomBreakdown,
      receiptsConfirmed: allReceiptsConfirmed,
    });
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message ?? "Invalid shift data", "error");
      return;
    }
    if (Math.abs(diff) > DISCREPANCY_LIMIT && !recountRequired) {
      setRecountRequired(true);
      return;
    }
    if (isReconcile) {
      finishConfirm();
    } else {
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = (pin: string): boolean => {
    const current = getUserByPin(pin);
    if (!user) return false;

    if (!current || current.user_name !== user.user_name) return false;
    setShowPinModal(false);
    finishConfirm();
    return true;
  };

  const handleStep0Next = () => {
    setStep(1);
  };

  const handleStep1Next = () => {
    setStep(2);
  };

  useEffect(() => {
    if (saved) {
      const receiptValues = Object.values(saved.receipts ?? {});
      const all = receiptValues.length > 0 && receiptValues.every(Boolean);
      setAllReceiptsConfirmed(hasCCReceipts ? all : true);
    }
  }, [saved, hasCCReceipts]);

  const [showExpected, setShowExpected] = useState(!settings.blindClose);
  const firstUpdate = useRef(true);

  const handleCountsChange = useCallback(
    (
      cash: number,
      _cards: number,
      breakdown: Record<string, number>
    ) => {
      setCountedCash(cash);
      setDenomBreakdown(breakdown);
      if (firstUpdate.current) {
        firstUpdate.current = false;
      } else if (settings.blindClose && !showExpected) {
        setShowExpected(true);
      }
      if (recountRequired) {
        setRecountRequired(false);
      }
    },
    [recountRequired, showExpected]
  );

  const saveProgress = () => {
    const data: ShiftProgress = {
      step,
      cash: countedCash,
      keycards: countedKeycards,
      receipts: receiptMap,
    };
    progressStore.save(data);
  };

  const progressData = useMemo<ShiftProgress>(
    () => ({
      step,
      cash: countedCash,
      keycards: countedKeycards,
      receipts: receiptMap,
    }),
    [step, countedCash, countedKeycards, receiptMap]
  );

  useAutoSaveShiftProgress(STORAGE_KEY, progressData);

  return (
    <>
      <StepProgress
        step={step}
        onStepChange={setStep}
        userName={user?.user_name}
      />
      {step === 0 && (
        <div className="relative dark:bg-darkSurface dark:text-darkAccentGreen">
          <button
            onClick={onCancel}
            aria-label="Close"
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-${isReconcile ? "warning" : "error"}-main text-white`}
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <CashCountingForm
            idPrefix={isReconcile ? "denomRecon_" : "denomClose_"}
            title={isReconcile ? "Reconcile Shift - Cash" : "Close Shift - Cash"}
            borderClass={`border-${isReconcile ? "warning" : "error"}-main`}
            textClass={`text-${isReconcile ? "warning" : "error"}-main`}
            confirmClass={`bg-${isReconcile ? "warning" : "error"}-main text-white rounded hover:bg-${isReconcile ? "warning" : "error"}-dark dark:bg-darkAccentGreen dark:text-darkBg`}
            confirmLabel="Next"
            expectedCash={expectedCashAtClose}
            showExpected={showExpected}
            onChange={handleCountsChange}
            onConfirm={handleStep0Next}
            onCancel={onCancel}
          />
          <button
            className="mt-2 px-3 py-1 bg-info-main text-white rounded dark:bg-darkSurface dark:text-darkAccentOrange"
            onClick={saveProgress}
          >
            Save Progress
          </button>
        </div>
      )}

      {step === 1 && (
        <div
          className={`border border-${isReconcile ? "warning" : "error"}-main rounded p-4 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface`}
        >
          {isReconcile ? (
            <CreditCardReceiptCheck
              transactions={ccTransactionsFromThisShift}
              initialCheckMap={receiptMap}
              onCheckStatusChange={setAllReceiptsConfirmed}
              onMapChange={setReceiptMap}
            />
          ) : (
            hasCCReceipts && (
              <CreditCardReceiptCheck
                transactions={ccTransactionsFromThisShift}
                onCheckStatusChange={setAllReceiptsConfirmed}
              />
            )
          )}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(0)}
              className="px-4 py-2 bg-info-main text-white rounded dark:bg-darkSurface dark:text-darkAccentOrange"
            >
              Back
            </button>
            <button
              onClick={handleStep1Next}
              className="px-4 py-2 bg-info-main text-white rounded dark:bg-darkSurface dark:text-darkAccentOrange"
            >
              Next
            </button>
            <button
              onClick={saveProgress}
              className="px-4 py-2 bg-info-main text-white rounded dark:bg-darkSurface dark:text-darkAccentOrange"
            >
              Save Progress
            </button>
          </div>
        </div>
      )}

      {showPinModal && (
        <PinEntryModal
          title="Confirm PIN"
          instructions="Enter your staff PIN to close the shift."
          onSubmit={handlePinSubmit}
          onCancel={() => setShowPinModal(false)}
          hideCancel
        />
      )}

      {step === 2 && !showPinModal && (
        <div className="relative dark:bg-darkSurface dark:text-darkAccentGreen">
          <button
            onClick={onCancel}
            aria-label="Close"
            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-${isReconcile ? "warning" : "error"}-main text-white`}
          >
            <span aria-hidden="true">&times;</span>
          </button>
            <KeycardCountForm
              expectedCount={expectedKeycardsAtClose}
              onConfirm={(count) => {
                setCountedKeycards(count);
                handleConfirm();
              }}
              onCancel={onCancel}
            hideCancel
          />
          {recountRequired && (
            <p className="mt-2 text-center text-warning-main text-sm dark:text-darkAccentGreen">
              Please recount and click Go again.
            </p>
          )}
          <button
            className="mt-2 px-3 py-1 bg-info-main text-white rounded dark:bg-darkSurface dark:text-darkAccentOrange"
            onClick={saveProgress}
          >
            Save Progress
          </button>
        </div>
      )}
    </>
  );
});
