import { memo, useCallback, useRef } from "react";

import { useAuth } from "../../context/AuthContext";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import { PinLoginInline } from "../common/PinLoginInline";

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
  const { user } = useAuth();
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

  const handlePinSubmit = useCallback(
    (pin: string): boolean => {
      const current = getUserByPin(pin);
      if (!user || !current || current.user_name !== user.user_name) {
        return false;
      }
      submitRef.current?.();
      return true;
    },
    [user]
  );

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
        <PinLoginInline onSubmit={handlePinSubmit} />
      </div>
    </CashCountingForm>
  );
});

export default SafeDepositForm;

