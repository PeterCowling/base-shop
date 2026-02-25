import { memo, useState } from "react";
import { z } from "zod";

import { Input } from "@acme/design-system";

import { showToast } from "../../utils/toastUtils";
import { DifferenceBadge } from "../common/DifferenceBadge";
import { FormActionButtons } from "../common/FormActionButtons";
import FormContainer from "../common/FormContainer";

export interface KeycardCountFormProps {
  expectedCount: number;
  onConfirm: (counted: number) => void;
  onCancel: () => void;
  hideCancel?: boolean;
}

export const KeycardCountForm = memo(function KeycardCountForm({
  expectedCount,
  onConfirm,
  onCancel,
  hideCancel,
}: KeycardCountFormProps) {
  const [countInput, setCountInput] = useState<string>("0");
  const counted = parseInt(countInput || "0", 10);
  const diff = counted - expectedCount;

  const countSchema = z.number().int().nonnegative();

  const handleConfirm = () => {
    const result = countSchema.safeParse(counted);
    if (!result.success) {
      showToast("Enter a non-negative number", "error");
      return;
    }
    onConfirm(result.data);
  };

  return (
    <FormContainer
      title="Count Keycards"
      borderColor="border-warning-main"
      onClose={onCancel}
    >
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="keycardCount" className="font-semibold">
          Count
        </label>
        <Input
          compatibilityMode="no-wrapper"
          id="keycardCount"
          type="number"
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          className="border rounded p-1 w-24"
        />
      </div>
      <div className="text-sm text-warning-main text-end mb-2">
        Expected: {expectedCount} &nbsp;
        <DifferenceBadge value={diff} />
      </div>
      <FormActionButtons
        onCancel={onCancel}
        onConfirm={handleConfirm}
        confirmText="Go"
        confirmColor="warning"
        hideCancel={hideCancel}
      />
    </FormContainer>
  );
});

export default KeycardCountForm;
