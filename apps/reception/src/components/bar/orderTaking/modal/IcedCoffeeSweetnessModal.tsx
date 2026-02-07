/* File: src/components/bar/orderTaking/modal/IcedCoffeeSweetnessModal.tsx */
import { useCallback } from "react";

import { withModalBackground } from "../../../../hoc/withModalBackground";

import ModalContainer from "./ModalContainer";

export interface IcedCoffeeSweetnessModalProps {
  productName: string;
  basePrice: number;
  onSelectSweetness: (finalName: string, price: number) => void;
  onCancel: () => void;
}

/**
 * IcedCoffeeSweetnessModalBase:
 * - Presents "Sweetened" or "Unsweetened" for iced coffees.
 */
function IcedCoffeeSweetnessModalBase(
  props: IcedCoffeeSweetnessModalProps
): JSX.Element {
  const { productName, basePrice, onSelectSweetness, onCancel } = props;

  const handleSweetened = useCallback(() => {
    onSelectSweetness(`${productName} (Sweetened)`, basePrice);
  }, [productName, basePrice, onSelectSweetness]);

  const handleUnsweetened = useCallback(() => {
    onSelectSweetness(`${productName} (Unsweetened)`, basePrice);
  }, [productName, basePrice, onSelectSweetness]);

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="text-lg font-semibold mb-4 text-center">
        {productName}: Sweetness
      </h2>
      <div className="flex flex-col space-y-3 mb-4">
        <button
          onClick={handleSweetened}
          className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        >
          Sweetened
        </button>
        <button
          onClick={handleUnsweetened}
          className="px-4 py-2 bg-primary-main text-white hover:bg-primary-dark transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
        >
          Unsweetened
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

IcedCoffeeSweetnessModalBase.displayName = "IcedCoffeeSweetnessModalBase";

const IcedCoffeeSweetnessModal = withModalBackground(
  IcedCoffeeSweetnessModalBase
);

export default IcedCoffeeSweetnessModal;
