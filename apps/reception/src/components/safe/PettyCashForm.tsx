// src/components/forms/PettyCashForm.tsx
import { memo, useCallback, useState } from "react";

import { Input } from "@acme/design-system";
import { Stack } from "@acme/design-system/primitives";
import { SimpleModal } from "@acme/ui/molecules";

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
    <SimpleModal
      isOpen={true}
      onClose={handleCancel}
      title="Petty Cash Withdrawal"
      maxWidth="max-w-sm"
    >
      {/* Input */}
      <Stack gap={4}>
        <Input
          compatibilityMode="no-wrapper"
          type="number"
          inputMode="decimal"
          className="w-32 rounded-lg border border-border-strong px-3 py-2 text-sm"
          placeholder="Amount"
          value={amount}
          onChange={handleAmountChange}
        />
      </Stack>

      {/* Reauth */}
      <div className="mt-6">
        <PasswordReauthInline
          onSubmit={handleReauthSubmit}
          submitLabel="Confirm withdrawal"
        />
      </div>
    </SimpleModal>
  );
});

export default PettyCashForm;
