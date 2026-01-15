/* File: src/components/bar/orderTaking/modal/SelectCoffeeOrTeaModal.tsx */
import { useCallback } from "react";

import { withModalBackground } from "../../../../hoc/withModalBackground";
import { AggregatedOrder } from "../../../../types/bar/BarTypes";
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
      <div className="flex flex-col space-y-2 mb-4">
        {coffeeOrTeaOrders.map((o) => (
          <button
            key={o.product}
            onClick={createSelectHandler(o.product)}
            className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors duration-200 rounded dark:bg-darkAccentGreen dark:text-darkBg dark:hover:bg-darkAccentGreen/80"
          >
            {o.count > 1 ? `${o.count}x ` : ""}
            {o.product}
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-300 text-black hover:bg-gray-400 transition-colors duration-200 rounded w-full dark:bg-darkSurface dark:text-darkAccentGreen"
      >
        Cancel
      </button>
    </ModalContainer>
  );
}

SelectCoffeeOrTeaModalBase.displayName = "SelectCoffeeOrTeaModalBase";

const SelectCoffeeOrTeaModal = withModalBackground(SelectCoffeeOrTeaModalBase);

export default SelectCoffeeOrTeaModal;
