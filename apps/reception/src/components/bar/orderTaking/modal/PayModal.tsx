/* File: src/components/bar/orderTaking/modal/PayModal.tsx */

import {
  ChangeEvent,
  memo,
  MouseEvent,
  ReactElement,
  useCallback,
  useState,
} from "react";

import ModalContainer from "./ModalContainer";
import { withModalBackground } from "../../../../hoc/withModalBackground";

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
      <div className="bg-blue-600 rounded-t dark:bg-darkAccentGreen">
        <h2 className="text-2xl font-bold text-white text-center py-4 dark:text-darkBg">
          Complete Payment
        </h2>
      </div>

      {/* Body content with spacing */}
      <div className="p-6 space-y-8">
        {/* Payment Method */}
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-700 text-center dark:text-darkAccentGreen">
            Payment Method
          </p>
          <div className="flex justify-center space-x-4">
            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                paymentMethod === "cash"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 dark:border-darkSurface"
              }`}
            >
              <input
                type="radio"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={handlePaymentChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700 font-medium dark:text-darkAccentGreen">Cash</span>
            </label>

            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                paymentMethod === "card"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 dark:border-darkSurface"
              }`}
            >
              <input
                type="radio"
                value="card"
                checked={paymentMethod === "card"}
                onChange={handlePaymentChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700 font-medium dark:text-darkAccentGreen">Credit Card</span>
            </label>
          </div>
        </div>

        {/* Bleep or Go */}
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-700 text-center dark:text-darkAccentGreen">
            Bleep or Go
          </p>
          <div className="flex justify-center space-x-4">
            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                bleepUsage === "bleep"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 dark:border-darkSurface"
              }`}
            >
              <input
                type="radio"
                value="bleep"
                checked={bleepUsage === "bleep"}
                onChange={handleBleepChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700 font-medium dark:text-darkAccentGreen">Bleep</span>
            </label>

            <label
              className={`flex flex-col items-center space-y-1 cursor-pointer p-2 border-2 rounded w-32 ${
                bleepUsage === "go"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 dark:border-darkSurface"
              }`}
            >
              <input
                type="radio"
                value="go"
                checked={bleepUsage === "go"}
                onChange={handleBleepChange}
                className="form-radio h-5 w-5 text-blue-600"
              />
              <span className="text-gray-700 font-medium dark:text-darkAccentGreen">Go</span>
            </label>
          </div>
        </div>

        {/* Buttons (Centered) */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleCancelClick}
            className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium dark:bg-darkSurface dark:text-darkAccentGreen"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-medium dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            Confirm
          </button>
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
