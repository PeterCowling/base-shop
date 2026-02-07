import { memo, useRef } from "react";

import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import PasswordReauthInline from "../common/PasswordReauthInline";

import { safeTransactionFormSchema } from "./schemas";

export interface SafeDepositFormProps {
  currentKeycards: number;
  onConfirm: (
    cash: number,
    keycardCount: number,
    keycardDifference: number,
    breakdown: Record<string, number>,
  ) => void;
  onCancel: () => void;
}

export const SafeDepositForm = memo(function SafeDepositForm({
  currentKeycards,
  onConfirm,
  onCancel,
}: SafeDepositFormProps) {
  const submitRef = useRef<(() => void) | undefined>(undefined);

  const handleConfirm = (
    cash: number,
    cards: number,
    breakdown: Record<string, number>
  ) => {
    const result = safeTransactionFormSchema.safeParse({
      amount: cash,
      keycardDifference: cards,
    });
    if (!result.success) {
      showToast("Please enter valid values", "error");
      return;
    }
    const keycardCount = currentKeycards + cards;
    onConfirm(cash, keycardCount, cards, breakdown);
  };

  return (
    <CashCountingForm
      idPrefix="safeDeposit_"
      title="Deposit Cash"
      borderClass="border-primary-main"
      textClass="text-primary-main"
      confirmClass="bg-primary-main text-white rounded hover:bg-primary-dark"
      confirmLabel="Confirm"
      showExpected={false}
      showKeycards
      keycardLabel="Keycards Deposited"
      onConfirm={handleConfirm}
      onCancel={onCancel}
      hideConfirm
      submitRef={submitRef}
    >
      <div className="mt-5">
        <PasswordReauthInline
          onSubmit={() => submitRef.current?.()}
          submitLabel="Confirm deposit"
        />
      </div>
    </CashCountingForm>
  );
});

export default SafeDepositForm;
