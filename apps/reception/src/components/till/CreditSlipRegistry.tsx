import { memo, useState } from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import { useCreditSlipsMutations } from "../../hooks/data/till/useCreditSlipsMutations";

/**
 * Simple form allowing the user to record a credit slip.
 */
export const CreditSlipRegistry = memo(function CreditSlipRegistry() {
  const [slipNumber, setSlipNumber] = useState("");
  const [amount, setAmount] = useState("");
  const { addCreditSlip } = useCreditSlipsMutations();

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!slipNumber || isNaN(amt)) return;
    addCreditSlip({ slipNumber, amount: amt });
    setSlipNumber("");
    setAmount("");
  };

  return (
    <div className="mt-6 border border-info-light rounded p-3">
      <h3 className="text-lg font-semibold mb-2">Credit Slip Registry</h3>
      <div className="flex flex-wrap gap-2 mb-2">
        <Input
          compatibilityMode="no-wrapper"
          type="text"
          placeholder="Slip #"
          className="border rounded p-1 flex-1"
          value={slipNumber}
          onChange={(e) => setSlipNumber(e.target.value)}
        />
        <Input
          compatibilityMode="no-wrapper"
          type="text"
          placeholder="Amount"
          className="border rounded p-1 w-28"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <Button
        onClick={handleAdd}
        className="px-3 py-1 bg-primary-main text-primary-fg rounded"
      >
        Add Slip
      </Button>
    </div>
  );
});
export default CreditSlipRegistry;
