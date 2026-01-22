import { memo, useCallback, useEffect, useState } from "react";
import { z } from "zod";

import { withModalBackground } from "../../hoc/withModalBackground";
import type {
  RemovalDestination,
  RemovalType,
  TenderRemovalRecord,
} from "../../types/finance";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";
import PinInput from "../common/PinInput";

export interface TenderRemovalModalProps {
  onConfirm: (record: TenderRemovalRecord) => void;
  onClose: () => void;
}

const tenderRemovalSchema = z.object({
  amount: z.number().positive(),
  removalType: z.enum(["SAFE_DROP", "BANK_DROP", "LIFT"]),
  destination: z.enum(["SAFE", "BANK"]).optional(),
});

function TenderRemovalModalBase({
  onConfirm,
  onClose,
}: TenderRemovalModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [removalType, setRemovalType] = useState<RemovalType>("SAFE_DROP");
  const [destination, setDestination] = useState<RemovalDestination>("SAFE");
  const [pinError, setPinError] = useState<boolean>(false);

  /** ---------- Effects --------------------------------------------------- */
  useEffect(() => {
    setDestination(removalType === "BANK_DROP" ? "BANK" : "SAFE");
  }, [removalType]);

  /** ---------- Helpers --------------------------------------------------- */
  const handleConfirm = useCallback(() => {
    const parsed = tenderRemovalSchema.safeParse({
      amount: parseFloat(amount),
      removalType,
      destination,
    });
    if (!parsed.success) {
      showToast(
        parsed.error.errors[0]?.message ?? "Invalid removal data",
        "error"
      );
      return;
    }
    onConfirm(parsed.data as TenderRemovalRecord);
  }, [amount, removalType, destination, onConfirm]);

  /** ---------- Direct PIN entry (inline) -------------------------------- */
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
            className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-error-main text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-error-main"
          >
            &times;
          </button>

          {/* Title */}
          <h2 className="mb-12 text-center text-xl font-semibold">
            Remove Cash
          </h2>

          {/* Form row */}
          <div className="flex flex-wrap text-center items-center justify-center gap-12 mb-12">
            <input
              type="number"
              inputMode="decimal"
              className="w-32 rounded border px-3 py-2 text-sm focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              className="w-36 rounded border px-2 py-2 text-sm focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
              value={removalType}
              onChange={(e) => setRemovalType(e.target.value as RemovalType)}
            >
              <option value="SAFE_DROP">Safe Drop</option>
              <option value="BANK_DROP">Bank Drop</option>
              <option value="LIFT">Lift</option>
            </select>

            {removalType !== "SAFE_DROP" && (
              <select
                className="w-32 rounded border px-2 py-2 text-sm focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main dark:bg-darkBg dark:text-darkAccentGreen"
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value as RemovalDestination)
                }
              >
                <option value="SAFE">Safe</option>
                <option value="BANK">Bank</option>
              </select>
            )}
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

TenderRemovalModalBase.displayName = "TenderRemovalModalBase";

export const TenderRemovalModal = withModalBackground(
  memo(TenderRemovalModalBase)
);
export default TenderRemovalModal;
