import { memo, useCallback, useState } from "react";
import { z } from "zod";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives";

import { withModalBackground } from "../../hoc/withModalBackground";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PasswordReauthInline from "../common/PasswordReauthInline";

export interface FloatEntryModalProps {
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

const floatEntryModalSchema = z.object({
  amount: z.number().positive(),
});

/** Modal to record additional float (change) added to the till. */
function FloatEntryModalBase({ onConfirm, onClose }: FloatEntryModalProps) {
  const [amount, setAmount] = useState<string>("");

  /** ---------- Helpers --------------------------------------------------- */
  const handleConfirm = useCallback(() => {
    const result = floatEntryModalSchema.safeParse({
      amount: parseFloat(amount),
    });
    if (!result.success) {
      showToast("Amount must be greater than zero", "error");
      return;
    }
    onConfirm(result.data.amount);
  }, [amount, onConfirm]);

  /** ---------- UI -------------------------------------------------------- */
  return (
    <>
      <ModalContainer widthClasses="w-120">
        <div className="relative rounded-lg bg-surface p-8 shadow-xl">
          {/* Close */}
          <Button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-0 h-7 w-7 rounded-full bg-error-main text-danger-fg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-main"
          >
            &times;
          </Button>

          {/* Title */}
          <h2 className="mb-12 text-center text-xl font-semibold">
            Add Change
          </h2>

          {/* Amount */}
          <Stack gap={0} align="center" className="text-center justify-center mb-12 sm:flex-row sm:items-end">
            <Input
              compatibilityMode="no-wrapper"
              type="number"
              inputMode="decimal"
              className="w-60 rounded-lg border px-3 py-2 text-sm"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Stack>

          {/* PIN */}
          <Stack gap={4} align="center" className="mt-6">
            <PasswordReauthInline
              onSubmit={handleConfirm}
              submitLabel="Confirm change"
            />
          </Stack>
        </div>
      </ModalContainer>

    </>
  );
}

FloatEntryModalBase.displayName = "FloatEntryModalBase";

export const FloatEntryModal = withModalBackground(memo(FloatEntryModalBase));
export default FloatEntryModal;
