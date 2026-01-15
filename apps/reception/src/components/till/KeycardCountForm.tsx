import { memo, useState } from "react";
import { z } from "zod";
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
      className="dark:bg-darkSurface"
    >
      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="keycardCount" className="font-semibold">
          Count
        </label>
        <input
          id="keycardCount"
          type="number"
          value={countInput}
          onChange={(e) => setCountInput(e.target.value)}
          className="border rounded p-1 w-24 dark:bg-darkBg dark:text-darkAccentGreen"
        />
      </div>
      <div className="text-sm text-warning-main text-right mb-2 dark:text-darkAccentGreen">
        Expected: {expectedCount} &nbsp;
        <DifferenceBadge value={diff} />
      </div>
      <FormActionButtons
        onCancel={onCancel}
        onConfirm={handleConfirm}
        confirmText="Go"
        confirmClassName="px-4 py-2 bg-warning-main text-white rounded hover:bg-warning-dark dark:bg-darkAccentGreen dark:text-darkBg"
        hideCancel={hideCancel}
      />
    </FormContainer>
  );
});

export default KeycardCountForm;
