/* File: src/bar/orderTaking/modal/WithMilkModal.tsx */
import React, { useCallback } from "react";

import { Button } from "@acme/design-system/atoms";

import { withModalBackground } from "../../../../hoc/withModalBackground";

import ModalContainer from "./ModalContainer";

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
        <Button
          onClick={handleWithMilk}
          color="primary"
          tone="solid"
        >
          With Milk
        </Button>
        <Button
          onClick={handleWithoutMilk}
          color="primary"
          tone="solid"
        >
          Without Milk
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

WithMilkModalBase.displayName = "WithMilkModalBase";

export default withModalBackground(WithMilkModalBase);
