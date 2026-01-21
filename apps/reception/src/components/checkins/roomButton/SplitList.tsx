// File: /src/components/checkins/roomButton/SplitList.tsx

import { faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo } from "react";
import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";
import PaymentSplitRow from "./PaymentSplitRow";

interface SplitListProps {
  splitPayments: PaymentSplit[];
  isDisabled: boolean;
  handleAmountChange: (index: number, newAmount: string) => void;
  handleSetPayType: (index: number, newPayType: PaymentType) => void;
  handleAddPaymentRow: () => void;
  handleRemovePaymentRow: (index: number) => void;
}

function SplitList({
  splitPayments,
  isDisabled,
  handleAmountChange,
  handleSetPayType,
  handleAddPaymentRow,
  handleRemovePaymentRow,
}: SplitListProps) {
  return (
    <>
      {splitPayments.map((sp, idx) => (
        <div key={sp.id} className="flex items-center space-x-2 mb-2">
          <PaymentSplitRow
            index={idx}
            sp={sp}
            isDisabled={isDisabled}
            handleAmountChange={handleAmountChange}
            handleSetPayType={handleSetPayType}
            handleAddPaymentRow={handleAddPaymentRow}
            handleRemovePaymentRow={handleRemovePaymentRow}
            showAddButton={idx === 0}
          />
          {idx === 0 ? (
            <button
              className="text-primary-main p-1 focus:outline-none"
              onClick={handleAddPaymentRow}
              disabled={isDisabled}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          ) : (
            <button
              className="text-error-main p-1 focus:outline-none"
              onClick={() => handleRemovePaymentRow(idx)}
              disabled={isDisabled}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </div>
      ))}
    </>
  );
}

export default memo(SplitList);
