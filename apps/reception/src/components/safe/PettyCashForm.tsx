// src/components/forms/PettyCashForm.tsx
import { memo, useCallback, useState } from "react";

import { showToast } from "../../utils/toastUtils";
import PasswordReauthInline from "../common/PasswordReauthInline";

import { safeTransactionFormSchema } from "./schemas";

export interface PettyCashFormProps {
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export const PettyCashForm = memo(function PettyCashForm({
  onConfirm,
  onCancel,
}: PettyCashFormProps) {
  const [amount, setAmount] = useState<string>("");

  /** ---------- Handlers -------------------------------------------------- */
  const handleCancel = useCallback(() => {
    setAmount("");
    onCancel();
  }, [onCancel]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value),
    []
  );

  const handleReauthSubmit = useCallback(async () => {
      const amt = parseFloat(amount);
      const result = safeTransactionFormSchema.safeParse({ amount: amt });
      if (!result.success) {
        showToast("Please enter valid values", "error");
        return;
      }

      onConfirm(amt);
      setAmount("");
    }, [amount, onConfirm]);

  /** ---------- UI -------------------------------------------------------- */
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        {/* Modal */}
        <div className="relative w-full max-w-sm rounded-lg bg-white p-8 shadow-xl dark:bg-darkSurface dark:text-darkAccentGreen">
          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-error-main text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-error-main"
            aria-label="Close"
          >
            &times;
          </button>

          {/* Title */}
          <h2 className="mb-6 text-center text-xl font-semibold">
            Petty Cash Withdrawal
          </h2>

          {/* Input */}
          <div className="flex flex-col gap-4">
            <input
              type="number"
              inputMode="decimal"
              className="w-32 rounded border px-3 py-2 text-sm focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
              placeholder="Amount"
              value={amount}
              onChange={handleAmountChange}
            />
          </div>

          {/* Reauth */}
          <div className="mt-6">
            <PasswordReauthInline
              onSubmit={handleReauthSubmit}
              submitLabel="Confirm withdrawal"
            />
          </div>
        </div>
      </div>
    </>
  );
});

export default PettyCashForm;
