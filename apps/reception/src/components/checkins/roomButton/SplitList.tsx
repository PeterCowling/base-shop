// File: /src/components/checkins/roomButton/SplitList.tsx

import { memo } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import { usePaymentContext } from "./PaymentContext";
import PaymentSplitRow from "./PaymentSplitRow";

function SplitList() {
  const {
    splitPayments,
    isDisabled,
    handleAddPaymentRow,
    handleRemovePaymentRow,
  } = usePaymentContext();

  return (
    <>
      {splitPayments.map((sp, idx) => (
        <div key={sp.id} className="flex items-center space-x-2 mb-2">
          <PaymentSplitRow
            index={idx}
            sp={sp}
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
