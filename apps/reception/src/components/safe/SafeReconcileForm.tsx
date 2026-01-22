import { memo, useRef, useState } from "react";

import { settings } from "../../constants/settings";
import { useAuth } from "../../context/AuthContext";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import { PinLoginInline } from "../common/PinLoginInline";

import { safeTransactionFormSchema } from "./schemas";

export interface SafeReconcileFormProps {
  expectedSafe: number;
  expectedKeycards: number;
  onConfirm: (
    count: number,
    difference: number,
    keycards: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ) => void;
  onCancel: () => void;
}

export const SafeReconcileForm = memo(function SafeReconcileForm({
  expectedSafe,
  expectedKeycards,
  onConfirm,
  onCancel,
}: SafeReconcileFormProps) {
  const [, setCountedCash] = useState(0);

  const [showExpected, setShowExpected] = useState(!settings.blindClose);
  const firstUpdate = useRef(true);

  const onCountsChange = (
    cash: number,
    _cards: number,
    _map: Record<string, number>
  ) => {
    setCountedCash(cash);

    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    if (settings.blindClose && !showExpected) {
      setShowExpected(true);
    }
  };

  const { user } = useAuth();
  const submitRef = useRef<(() => void) | undefined>(undefined);

  const handleConfirm = (
    cash: number,
    cards: number,
    map: Record<string, number>
  ) => {
    const result = safeTransactionFormSchema.safeParse({
      amount: cash,
      keycards: cards,
    });
    if (!result.success) {
      showToast("Please enter valid values", "error");
      return;
    }
    const difference = cash - expectedSafe;
    const cardDiff = cards - expectedKeycards;
    onConfirm(cash, difference, cards, cardDiff, map);
  };

  const handlePinSubmit = (pin: string): boolean => {
    const current = getUserByPin(pin);
    if (!user) return false;
    if (!current || current.user_name !== user.user_name) return false;
    submitRef.current?.();
    return true;
  };

  return (
    <>
      <div className="relative dark:bg-darkSurface">
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-error-main text-white"
        >
          x
        </button>
        <CashCountingForm
          idPrefix="safeRecon_"
          title="Reconcile Safe"
          borderClass="border-warning-main"
          textClass="text-warning-main"
          confirmClass="bg-warning-main text-white rounded hover:bg-warning-dark dark:bg-darkAccentOrange dark:text-darkBg"
          confirmLabel="Go"
          expectedCash={expectedSafe}
          expectedKeycards={expectedKeycards}
          showExpected={showExpected}
          showKeycards
          onChange={onCountsChange}
          onConfirm={handleConfirm}
          onCancel={onCancel}
          hideCancel
          hideConfirm
          submitRef={submitRef}
        >
          <div className="mb-5 mt-[30px]">
            <PinLoginInline onSubmit={handlePinSubmit} />
          </div>
        </CashCountingForm>
      </div>
    </>
  );
});

export default SafeReconcileForm;
