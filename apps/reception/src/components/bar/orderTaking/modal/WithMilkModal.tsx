/* File: src/bar/orderTaking/modal/WithMilkModal.tsx */
import React, { useCallback } from "react";

import ModalContainer from "./ModalContainer";
import { withModalBackground } from "../../../../hoc/withModalBackground";

export interface WithMilkModalProps {
  productName: string;
  basePrice: number;
  onSelectMilkOption: (finalName: string, price: number) => void;
  onCancel: () => void;
}

/**
 * WithMilkModalBase:
 * - Presents two choices: "With Milk" or "Without Milk".
 */
function WithMilkModalBase(props: WithMilkModalProps): JSX.Element {
  const { productName, basePrice, onSelectMilkOption, onCancel } = props;

  const handleWithMilk = useCallback(() => {
    onSelectMilkOption(`${productName} (With Milk)`, basePrice);
  }, [productName, basePrice, onSelectMilkOption]);

  const handleWithoutMilk = useCallback(() => {
    onSelectMilkOption(`${productName} (No Milk)`, basePrice);
  }, [productName, basePrice, onSelectMilkOption]);

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="text-lg font-semibold mb-4 text-center">
        {productName}: Milk Option
      </h2>
      <div className="flex flex-col space-y-3 mb-4">
        <button
          onClick={handleWithMilk}
          className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        >
          With Milk
        </button>
        <button
          onClick={handleWithoutMilk}
          className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        >
          Without Milk
        </button>
      </div>
      <button
        onClick={onCancel}
        className="px-4 py-2 w-full bg-gray-300 text-black hover:bg-gray-400 transition-colors duration-200 rounded dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        Cancel
      </button>
    </ModalContainer>
  );
}

WithMilkModalBase.displayName = "WithMilkModalBase";

export default withModalBackground(WithMilkModalBase);
