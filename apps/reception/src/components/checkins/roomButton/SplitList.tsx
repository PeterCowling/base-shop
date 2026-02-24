// File: /src/components/checkins/roomButton/SplitList.tsx

import { memo } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

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
            <Button
              className="text-primary-main p-1 focus:outline-none"
              onClick={handleAddPaymentRow}
              disabled={isDisabled}
            >
              <Plus size={16} />
            </Button>
          ) : (
            <Button
              className="text-error-main p-1 focus:outline-none"
              onClick={() => handleRemovePaymentRow(idx)}
              disabled={isDisabled}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      ))}
    </>
  );
}

export default memo(SplitList);
