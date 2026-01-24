import { memo, useRef, useState } from "react";

import { showToast } from "../../utils/toastUtils";
import { CashCountingForm } from "../common/CashCountingForm";
import PasswordReauthInline from "../common/PasswordReauthInline";

import { safeTransactionFormSchema } from "./schemas";

export interface SafeWithdrawalFormProps {
  onConfirm: (
    amount: number,
    breakdown: Record<string, number>
  ) => Promise<void>;
  onCancel: () => void;
}

export const SafeWithdrawalForm = memo(function SafeWithdrawalForm({
  onConfirm,
  onCancel,
}: SafeWithdrawalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const submitRef = useRef<(() => void) | undefined>(undefined);

  const handleConfirm = async (
    cash: number,
    _cards: number,
    breakdown: Record<string, number>
  ) => {
    const result = safeTransactionFormSchema.safeParse({ amount: cash });
    if (!result.success) {
      showToast("Please enter valid values", "error");
      return;
    }
    setError(null);
    try {
      await onConfirm(cash, breakdown);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <CashCountingForm
      idPrefix="safeWithdrawal_"
      title="Withdraw Cash"
      borderClass="border-primary-main"
      textClass="text-primary-main"
      confirmClass="bg-primary-main text-white rounded hover:bg-primary-dark dark:text-darkBg"
      confirmLabel="Confirm"
      showExpected={false}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      hideConfirm
      submitRef={submitRef}
    >
      <div className="mt-5">
        <PasswordReauthInline
          onSubmit={() => submitRef.current?.()}
          submitLabel="Confirm withdrawal"
        />
        {error && (
          <p className="mt-2 text-error-main" role="alert">
            {error}
          </p>
        )}
      </div>
    </CashCountingForm>
  );
});

export default SafeWithdrawalForm;
