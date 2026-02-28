/* File: src/components/bar/orderTaking/modal/SelectCoffeeOrTeaModal.tsx */
import { useCallback } from "react";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives";

import { withModalBackground } from "../../../../hoc/withModalBackground";
import { type AggregatedOrder } from "../../../../types/bar/BarTypes";

import ModalContainer from "./ModalContainer";

export interface SelectCoffeeOrTeaModalProps {
  coffeeOrTeaOrders: AggregatedOrder[];
  milkName: string;
  onSelectOrder: (productName: string) => void;
  onCancel: () => void;
}

/**
 * SelectCoffeeOrTeaModalBase:
 * - Lists existing coffee/tea items in the order
 * - user picks which item gets the milk add-on.
 */
function SelectCoffeeOrTeaModalBase(
  props: SelectCoffeeOrTeaModalProps
): JSX.Element {
  const { coffeeOrTeaOrders, milkName, onSelectOrder, onCancel } = props;

  const createSelectHandler = useCallback(
    (productName: string) => () => {
      onSelectOrder(productName);
    },
    [onSelectOrder]
  );

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Add {milkName} to which item?
      </h2>
      <Stack gap={2} className="mb-4">
        {coffeeOrTeaOrders.map((o) => (
          <Button
            key={o.product}
            onClick={createSelectHandler(o.product)}
            color="primary"
            tone="solid"
          >
            {o.count > 1 ? `${o.count}x ` : ""}
            {o.product}
          </Button>
        ))}
      </Stack>
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

SelectCoffeeOrTeaModalBase.displayName = "SelectCoffeeOrTeaModalBase";

const SelectCoffeeOrTeaModal = withModalBackground(SelectCoffeeOrTeaModalBase);

export default SelectCoffeeOrTeaModal;
