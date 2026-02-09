"use client";

import { memo, useCallback, useState } from "react";
import { z } from "zod";

import { withModalBackground } from "../../hoc/withModalBackground";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PasswordReauthInline from "../common/PasswordReauthInline";

export interface AddKeycardsModalProps {
  onConfirm: (count: number) => Promise<void>;
  onCancel: () => void;
}

const countSchema = z.object({ count: z.number().int().positive() });

function AddKeycardsModalBase({ onConfirm, onCancel }: AddKeycardsModalProps) {
  const [countInput, setCountInput] = useState<string>("");

  /** ---------- Callbacks ------------------------------------------------- */
  const handleReauthSubmit = useCallback(async () => {
      const parsed = countSchema.safeParse({ count: Number(countInput) });
      if (!parsed.success) {
        showToast("Count must be a positive integer", "error");
        return;
      }
      await onConfirm(parsed.data.count);
      setCountInput("");
    }, [countInput, onConfirm]);

  /** ---------- UI -------------------------------------------------------- */
  return (
    <ModalContainer widthClasses="w-120">
      <div className="relative rounded-lg bg-white p-8 shadow-xl dark:bg-darkSurface dark:text-darkAccentGreen">
        {/* Close */}
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-error-main text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-error-main"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="mb-6 text-center text-xl font-semibold">Add Keycards</h2>

        {/* Count input */}
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

        {/* PIN */}
        <div className="mt-6">
          <PasswordReauthInline
            onSubmit={handleReauthSubmit}
            submitLabel="Confirm add"
          />
        </div>
      </div>
    </ModalContainer>
  );
}

AddKeycardsModalBase.displayName = "AddKeycardsModalBase";

export default withModalBackground(memo(AddKeycardsModalBase));
