/* src/components/eodChecklist/OpeningFloatModal.tsx */

import { memo, useCallback, useState } from "react";
import { z } from "zod";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { settings } from "../../constants/settings";
import { withModalBackground } from "../../hoc/withModalBackground";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

export interface OpeningFloatModalProps {
  onConfirm: (amount: number) => Promise<void> | void;
  onClose: () => void;
}

const openingFloatModalSchema = z.object({
  amount: z.number().min(0),
});

/** Modal to record the opening float for the next shift. No PIN required (memo-only write). */
function OpeningFloatModalBase({ onConfirm, onClose }: OpeningFloatModalProps) {
  const [amount, setAmount] = useState<string>(
    settings.standardFloat > 0 ? String(settings.standardFloat) : ""
  );
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    const result = openingFloatModalSchema.safeParse({
      amount: parseFloat(amount),
    });
    if (!result.success) {
      showToast("Amount must be zero or greater", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(result.data.amount);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [amount, onConfirm, onClose]);

  return (
    <ModalContainer widthClasses="w-120">
      <div className="relative rounded-lg bg-surface p-8 shadow-xl">
        {/* Close */}
        <Button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-0 top-0 h-7 w-7 rounded-full bg-error-main text-primary-fg transition-opacity hover:opacity-90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-error-main"
        >
          &times;
        </Button>

        {/* Title */}
        <h2 className="mb-12 text-center text-xl font-semibold">
          Set Opening Float
        </h2>

        {/* Amount */}
        <div className="mb-12 flex flex-col items-center justify-center text-center sm:flex-row sm:items-end">
          <Input
            compatibilityMode="no-wrapper"
            type="number"
            inputMode="decimal"
            className="w-60 rounded-lg border px-3 py-2 text-sm"
            placeholder="Amount (€)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Confirm */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <Button
            onClick={() => void handleConfirm()}
            disabled={submitting}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-fg hover:bg-primary-hover active:bg-primary-active disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Confirm float"}
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}

OpeningFloatModalBase.displayName = "OpeningFloatModalBase";

export const OpeningFloatModal = withModalBackground(memo(OpeningFloatModalBase));
export default OpeningFloatModal;
