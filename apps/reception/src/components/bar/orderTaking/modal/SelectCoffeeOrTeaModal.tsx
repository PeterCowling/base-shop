/* File: src/components/bar/orderTaking/modal/SelectCoffeeOrTeaModal.tsx */
import { useCallback } from "react";

import { Stack } from "@acme/design-system/primitives";
import { ReceptionButton as Button } from "@acme/ui/operations";

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
            className="px-4 py-2 bg-success-main text-primary-fg hover:bg-success-main transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            {o.count > 1 ? `${o.count}x ` : ""}
            {o.product}
          </Button>
        ))}
      </Stack>
      <Button
        onClick={onCancel}
        className="px-4 py-2 bg-surface-3 text-foreground hover:bg-surface-3 transition-colors duration-200 rounded w-full dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        Cancel
      </Button>
    </ModalContainer>
  );
}

SelectCoffeeOrTeaModalBase.displayName = "SelectCoffeeOrTeaModalBase";

const SelectCoffeeOrTeaModal = withModalBackground(SelectCoffeeOrTeaModalBase);

export default SelectCoffeeOrTeaModal;
