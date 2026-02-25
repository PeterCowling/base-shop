/* File: src/components/bar/orderTaking/modal/IcedCoffeeSweetnessModal.tsx */
import { useCallback } from "react";

import { Button } from "@acme/design-system/atoms";

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
        <Button
          onClick={handleSweetened}
          color="primary"
          tone="solid"
        >
          Sweetened
        </Button>
        <Button
          onClick={handleUnsweetened}
          color="primary"
          tone="solid"
        >
          Unsweetened
        </Button>
      </div>
      <Button
        onClick={onCancel}
        color="default"
        tone="soft"
        className="w-full"
      >
        Cancel
      </Button>
    </ModalContainer>
  );
}

IcedCoffeeSweetnessModalBase.displayName = "IcedCoffeeSweetnessModalBase";

const IcedCoffeeSweetnessModal = withModalBackground(
  IcedCoffeeSweetnessModalBase
);

export default IcedCoffeeSweetnessModal;
