import { memo, useCallback, useState } from "react";
import { z } from "zod";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../hoc/withModalBackground";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PasswordReauthInline from "../common/PasswordReauthInline";

export interface CountInputModalProps {
  title: string;
  submitLabel: string;
  onConfirm: (count: number) => Promise<void>;
  onCancel: () => void;
}

const countSchema = z.object({ count: z.number().int().positive() });

function CountInputModalBase({
  title,
  submitLabel,
  onConfirm,
  onCancel,
}: CountInputModalProps) {
  const [countInput, setCountInput] = useState<string>("");

  const handleReauthSubmit = useCallback(async () => {
    const parsed = countSchema.safeParse({ count: Number(countInput) });
    if (!parsed.success) {
      showToast("Count must be a positive integer", "error");
      return;
    }
    await onConfirm(parsed.data.count);
    setCountInput("");
  }, [countInput, onConfirm]);

  return (
    <ModalContainer widthClasses="w-120">
      <div className="relative rounded-lg bg-surface p-8 shadow-xl">
        <Button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-0 top-0 h-7 w-7 rounded-full bg-error-main text-danger-fg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-main"
        >
          &times;
        </Button>

        <h2 className="mb-6 text-center text-xl font-semibold">{title}</h2>

        <label className="block text-center mt-12 mb-12">
          <span className="text-sm font-semibold">Count</span>
          <Input
            compatibilityMode="no-wrapper"
            type="number"
            min={1}
            className="w-60 rounded-lg border mx-6 px-3 py-2 text-sm"
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
          />
        </label>

        <div className="mt-6">
          <PasswordReauthInline
            onSubmit={handleReauthSubmit}
            submitLabel={submitLabel}
          />
        </div>
      </div>
    </ModalContainer>
  );
}

CountInputModalBase.displayName = "CountInputModalBase";

export const CountInputModal = withModalBackground(memo(CountInputModalBase));
export default CountInputModal;
