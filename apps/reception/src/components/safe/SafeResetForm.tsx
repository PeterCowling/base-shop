import { memo, useRef, useState } from "react";

import { Stack } from "@acme/design-system/primitives";

import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import { DifferenceBadge } from "../common/DifferenceBadge";
import PasswordReauthInline from "../common/PasswordReauthInline";

import { safeTransactionFormSchema } from "./schemas";

export interface SafeResetFormProps {
  currentKeycards: number;
  onConfirm: (
    cash: number,
    keycards: number,
    keycardDifference: number,
    breakdown: Record<string, number>
  ) => void;
  onCancel: () => void;
}

export const SafeResetForm = memo(function SafeResetForm({
  currentKeycards,
  onConfirm,
  onCancel,
}: SafeResetFormProps) {
  const [countedKeycards, setCountedKeycards] = useState(0);
  const submitRef = useRef<(() => void) | undefined>(undefined);

  const handleConfirm = (
    cash: number,
    cards: number,
    breakdown: Record<string, number>
  ) => {
    const diff = cards - currentKeycards;
    const result = safeTransactionFormSchema.safeParse({
      amount: cash,
      keycards: cards,
      keycardDifference: diff,
    });
    if (!result.success) {
      showToast("Please enter valid values", "error");
      return;
    }
    onConfirm(cash, cards, diff, breakdown);
  };

  return (
    <CashCountingForm
      idPrefix="safeReset_"
      title="Reset Safe"
      borderClass="border-info-main"
      textClass="text-info-main"
      confirmColor="primary"
      confirmLabel="Go"
      showExpected={false}
      showKeycards
      onConfirm={handleConfirm}
      onCancel={onCancel}
      onChange={(_, cards) => setCountedKeycards(cards)}
      hideConfirm
      submitRef={submitRef}
    >
      <Stack align="end" className="mt-4 text-info-main text-sm">
        <div>Expected keycards: {currentKeycards}</div>
        <DifferenceBadge value={countedKeycards - currentKeycards} />
      </Stack>
      <div className="mt-4">
        <PasswordReauthInline
          onSubmit={() => submitRef.current?.()}
          submitLabel="Confirm reset"
        />
      </div>
    </CashCountingForm>
  );
});

export default SafeResetForm;
