import { memo, useRef, useState } from "react";

import { Button } from "@acme/design-system/atoms";

import { settings } from "../../constants/settings";
import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import PasswordReauthInline from "../common/PasswordReauthInline";

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

  return (
    <>
      <div className="relative">
        <Button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-2 top-2 h-6 w-6 rounded-full bg-surface-2 border border-border-strong text-muted-foreground hover:bg-surface-3 text-xs"
        >
          ✕
        </Button>
        <CashCountingForm
          idPrefix="safeRecon_"
          title="Reconcile Safe"
          borderClass="border-warning"
          textClass="text-warning"
          confirmColor="warning"
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
          <div className="mb-5 mt-8">
            <PasswordReauthInline
              onSubmit={() => submitRef.current?.()}
              submitLabel="Confirm reconcile"
            />
          </div>
        </CashCountingForm>
      </div>
    </>
  );
});

export default SafeReconcileForm;
