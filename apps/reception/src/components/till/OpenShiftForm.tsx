/* src/components/till/OpenShiftForm.tsx */

import { memo, useCallback, useMemo, useState } from "react";
import { z } from "zod";

import { settings } from "../../constants/settings";
import { OpenShiftFormProps } from "../../types/component/Till";
import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import { CreditCardReceiptCheck } from "./CreditCardReceiptCheck";
import useShiftProgress, {
  type ShiftProgress,
  useAutoSaveShiftProgress,
} from "../../hooks/utilities/useShiftProgress";

const calcBreakdownTotal = (breakdown: Record<string, number>): number =>
  Object.entries(breakdown).reduce(
    (sum, [denom, count]) => sum + Number(denom) * count,
    0
  );

const openShiftFormSchema = z
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
 * Form to open a shift:
 * - Count denominations for the opening cash
 * - Confirm credit card receipts from the previous shift
 */
export const OpenShiftForm = memo(function OpenShiftForm({
  ccTransactionsFromLastShift,
  previousFinalCash,
  onConfirm,
  onCancel,
}: OpenShiftFormProps) {
  const hasCCReceipts = ccTransactionsFromLastShift.length > 0;

  const STORAGE_KEY = "open-shift-progress";
  const progressStore = useShiftProgress(STORAGE_KEY);
  const saved = progressStore.load();

  // If no CC receipts exist, default to true so we can open immediately
  const [allReceiptsConfirmed, setAllReceiptsConfirmed] = useState<boolean>(
    hasCCReceipts
      ? Boolean(saved?.receipts?.confirmed)
      : true
  );

  const [countedCash, setCountedCash] = useState(saved?.cash ?? 0);
  const [countedKeycards, setCountedKeycards] = useState(saved?.keycards ?? 0);
  const [denomBreakdown, setDenomBreakdown] = useState<Record<string, number>>({});
  const [showPrevious, setShowPrevious] = useState(
    saved?.step === 1 || !settings.blindOpen
  );

  /**
   * When blindOpen is true, the user must confirm their count once before
   * revealing the previous closing amount. A second confirmation finalizes the
   * shift opening.
   */
  const [countConfirmed, setCountConfirmed] = useState(saved?.step === 1);

  const differenceFromPrevious = countedCash - previousFinalCash;

  const progressData = useMemo<ShiftProgress>(
    () => ({
      step: countConfirmed ? 1 : 0,
      cash: countedCash,
      keycards: countedKeycards,
      receipts: { confirmed: allReceiptsConfirmed },
    }),
    [countConfirmed, countedCash, countedKeycards, allReceiptsConfirmed]
  );

  useAutoSaveShiftProgress(STORAGE_KEY, progressData);

  const finishConfirm = () => {
    progressStore.clear();
    onConfirm(countedCash, allReceiptsConfirmed, countedKeycards, denomBreakdown);
  };

  const handleConfirm = (
    cash: number,
    cards: number,
    breakdown: Record<string, number>
  ) => {
    const validation = openShiftFormSchema.safeParse({
      cash,
      keycards: cards,
      breakdown,
      receiptsConfirmed: allReceiptsConfirmed,
    });
    if (!validation.success) {
      showToast(validation.error.errors[0]?.message ?? "Invalid shift data", "error");
      return;
    }

    setCountedCash(validation.data.cash);
    setCountedKeycards(validation.data.keycards);
    setDenomBreakdown(validation.data.breakdown);
    if (settings.blindOpen && !countConfirmed) {
      setShowPrevious(true);
      setCountConfirmed(true);
      return;
    }
    finishConfirm();
  };

  const handleCountsChange = useCallback(
    (
      cash: number,
      cards: number,
      breakdown: Record<string, number>
    ) => {
      setCountedCash(cash);
      setCountedKeycards(cards);
      setDenomBreakdown(breakdown);
    },
    []
  );

  return (
    <>
      <CashCountingForm
        idPrefix="denomOpen_"
        title="Open Shift"
        borderClass="border-info-main"
        textClass="text-info-main"
        confirmClass="bg-primary-main text-white rounded hover:bg-primary-dark"
        confirmLabel="Confirm Shift Opening"
        showKeycards
        keycardLabel="Starting Keycards"
        showExpected={false}
        onChange={handleCountsChange}
        onConfirm={handleConfirm}
        onCancel={onCancel}
      >
        {hasCCReceipts && (
          <CreditCardReceiptCheck
            transactions={ccTransactionsFromLastShift}
            onCheckStatusChange={setAllReceiptsConfirmed}
          />
        )}
        {showPrevious && (
          <div className="text-sm text-info-main text-right mt-4 dark:text-darkAccentGreen">
            <div className="mb-2">
              Previous count was €{previousFinalCash.toFixed(2)}
            </div>
            <div>Difference: €{differenceFromPrevious.toFixed(2)}</div>
          </div>
        )}
      </CashCountingForm>
    </>
  );
});
