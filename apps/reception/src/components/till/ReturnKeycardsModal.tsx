import { memo, useCallback, useState } from "react";
import { z } from "zod";

import { withModalBackground } from "../../hoc/withModalBackground";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PasswordReauthInline from "../common/PasswordReauthInline";

export interface ReturnKeycardsModalProps {
  onConfirm: (count: number) => Promise<void>;
  onCancel: () => void;
}

const countSchema = z.object({ count: z.number().int().positive() });

function ReturnKeycardsModalBase({ onConfirm, onCancel }: ReturnKeycardsModalProps) {
  const [countInput, setCountInput] = useState("");

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
      <div className="relative rounded-lg bg-white p-8 shadow-xl dark:bg-darkSurface dark:text-darkAccentGreen">
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-error-main text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-error-main"
        >
          &times;
        </button>
        <h2 className="mb-6 text-center text-xl font-semibold">Return Keycards</h2>
        <label className="block text-center mt-12 mb-12">
          <span className="text-sm font-semibold">Count</span>
          <input
            type="number"
            min={1}
            className="w-60 rounded border mx-6 px-3 py-2 text-sm focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
          />
        </label>
        <div className="mt-6">
          <PasswordReauthInline
            onSubmit={handleReauthSubmit}
            submitLabel="Confirm return"
          />
        </div>
      </div>
    </ModalContainer>
  );
}

ReturnKeycardsModalBase.displayName = "ReturnKeycardsModalBase";

export default withModalBackground(memo(ReturnKeycardsModalBase));
