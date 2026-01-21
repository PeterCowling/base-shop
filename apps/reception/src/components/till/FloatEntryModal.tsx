import { memo, useCallback, useState } from "react";
import { z } from "zod";
import { withModalBackground } from "../../hoc/withModalBackground";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PinInput from "../common/PinInput";

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

  const [pinError, setPinError] = useState<boolean>(false);

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

  /** ---------- Direct PIN entry ----------------------------------------- */
  const handlePinChange = useCallback(
    (val: string) => {
      if (val.length !== 6) {
        setPinError(false);
        return;
      }
      if (!getUserByPin(val)) {
        setPinError(true);
        return;
      }
      setPinError(false);
      handleConfirm();
    },
    [handleConfirm]
  );

  /** ---------- UI -------------------------------------------------------- */
  return (
    <>
      <ModalContainer widthClasses="w-120">
        <div className="relative rounded-lg bg-white p-8 shadow-xl dark:bg-darkSurface dark:text-darkAccentGreen">
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-error-main text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-error-main"
          >
            &times;
          </button>

          {/* Title */}
          <h2 className="mb-12 text-center text-xl font-semibold">
            Add Change
          </h2>

          {/* Amount */}
          <div className="flex flex-col text-center  items-center justify-center  mb-12 sm:flex-row sm:items-end">
            <input
              type="number"
              inputMode="decimal"
              className="w-60  rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* PIN */}
          <div className="mt-6 flex flex-col items-center gap-4">
            <PinInput
              onChange={handlePinChange}
              placeholder="PIN"
              title="Confirm PIN"
            />
            {pinError && <p className="text-sm text-error-main">Invalid PIN</p>}
          </div>
        </div>
      </ModalContainer>

    </>
  );
}

FloatEntryModalBase.displayName = "FloatEntryModalBase";

export const FloatEntryModal = withModalBackground(memo(FloatEntryModalBase));
export default FloatEntryModal;
