/* File: src/components/bar/orderTaking/modal/PayModal.tsx */

import {
  type ChangeEvent,
  memo,
  type MouseEvent,
  type ReactElement,
  useCallback,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../../../hoc/withModalBackground";

import ModalContainer from "./ModalContainer";

/**
 * PayModalProps:
 * - onConfirm(paymentMethod, bleepUsage): pass chosen method & usage to parent.
 * - onCancel(): close the modal without finalizing.
 */
export interface PayModalProps {
  onConfirm: (
    paymentMethod: "cash" | "card",
    bleepUsage: "bleep" | "go"
  ) => void;
  onCancel: () => void;
}

/**
 * PayModalBase:
 * - User chooses payment method ("Cash"/"Card")
 * - Chooses "Bleep" or "Go"
 * - onConfirm => passes chosen method & usage up.
 */
function PayModalBase({ onConfirm, onCancel }: PayModalProps): ReactElement {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("card");
  const [bleepUsage, setBleepUsage] = useState<"bleep" | "go">("bleep");

  const handleConfirmClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onConfirm(paymentMethod, bleepUsage);
    },
    [onConfirm, paymentMethod, bleepUsage]
  );

  const handleCancelClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onCancel();
    },
    [onCancel]
  );

  const handlePaymentChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPaymentMethod(event.target.value as "cash" | "card");
    },
    []
  );

  const handleBleepChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setBleepUsage(event.target.value as "bleep" | "go");
    },
    []
  );

  return (
    <ModalContainer widthClasses="w-96">
      {/* Header with distinct background color */}
      <div className="bg-info-main rounded-t">
        <h2 className="text-2xl font-bold text-primary-fg text-center py-4">
          Complete Payment
        </h2>
      </div>

      {/* Body content with spacing */}
      <div className="p-6 space-y-8">
        {/* Payment Method */}
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground text-center">
            Payment Method
          </p>
          <div className="flex justify-center space-x-4">
            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                paymentMethod === "cash"
                  ? "border-info-main bg-info-light/20"
                  : "border-border-2 hover:border-border-2"
              }`}
            >
              <Input
                compatibilityMode="no-wrapper"
                type="radio"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={handlePaymentChange}
                className="form-radio h-5 w-5 text-info-main"
              />
              <span className="text-foreground font-medium">Cash</span>
            </label>

            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                paymentMethod === "card"
                  ? "border-info-main bg-info-light/20"
                  : "border-border-2 hover:border-border-2"
              }`}
            >
              <Input
                compatibilityMode="no-wrapper"
                type="radio"
                value="card"
                checked={paymentMethod === "card"}
                onChange={handlePaymentChange}
                className="form-radio h-5 w-5 text-info-main"
              />
              <span className="text-foreground font-medium">Credit Card</span>
            </label>
          </div>
        </div>

        {/* Bleep or Go */}
        <div className="space-y-3">
          <p className="text-lg font-semibold text-foreground text-center">
            Bleep or Go
          </p>
          <div className="flex justify-center space-x-4">
            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                bleepUsage === "bleep"
                  ? "border-info-main bg-info-light/20"
                  : "border-border-2 hover:border-border-2"
              }`}
            >
              <Input
                compatibilityMode="no-wrapper"
                type="radio"
                value="bleep"
                checked={bleepUsage === "bleep"}
                onChange={handleBleepChange}
                className="form-radio h-5 w-5 text-info-main"
              />
              <span className="text-foreground font-medium">Bleep</span>
            </label>

            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                bleepUsage === "go"
                  ? "border-info-main bg-info-light/20"
                  : "border-border-2 hover:border-border-2"
              }`}
            >
              <Input
                compatibilityMode="no-wrapper"
                type="radio"
                value="go"
                checked={bleepUsage === "go"}
                onChange={handleBleepChange}
                className="form-radio h-5 w-5 text-info-main"
              />
              <span className="text-foreground font-medium">Go</span>
            </label>
          </div>
        </div>

        {/* Buttons (Centered) */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleCancelClick}
            color="default"
            tone="soft"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClick}
            color="success"
            tone="solid"
          >
            Confirm
          </Button>
        </div>
      </div>
    </ModalContainer>
  );
}

PayModalBase.displayName = "PayModalBase";
const MemoizedPayModalBase = memo(PayModalBase);

// Wrap in HOC for the modal background dimming/styling
const PayModal = withModalBackground(MemoizedPayModalBase);

export default PayModal;
