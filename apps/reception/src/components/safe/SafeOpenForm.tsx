import { memo, useState } from "react";
import { showToast } from "../../utils/toastUtils";
import { FormActionButtons } from "../common/FormActionButtons";
import FormContainer from "../common/FormContainer";
import { safeTransactionFormSchema } from "./schemas";

export interface SafeOpenFormProps {
  onConfirm: (count: number, keycards: number) => void;
  onCancel: () => void;
}

export const SafeOpenForm = memo(function SafeOpenForm({
  onConfirm,
  onCancel,
}: SafeOpenFormProps) {
  const [count, setCount] = useState("");
  const [keycards, setKeycards] = useState("");

  const handleConfirm = () => {
    const c = parseFloat(count);
    const k = parseInt(keycards || "0", 10);
    const result = safeTransactionFormSchema.safeParse({
      amount: c,
      keycards: k,
    });
    if (!result.success) {
      showToast("Please enter valid values", "error");
      return;
    }
    onConfirm(c, k);
  };

  return (
    <FormContainer
      title="Open Safe"
      borderColor="border-info-main"
      className="dark:bg-darkSurface"
    >
      <input
        type="number"
        className="border rounded p-1 w-full"
        placeholder="Opening Count"
        value={count}
        onChange={(e) => setCount(e.target.value)}
      />
      <input
        type="number"
        className="border rounded p-1 w-full mt-2"
        placeholder="Opening Keycards"
        value={keycards}
        onChange={(e) => setKeycards(e.target.value)}
      />
      <FormActionButtons
        onCancel={onCancel}
        onConfirm={handleConfirm}
        confirmClassName="px-4 py-2 bg-primary-main text-white rounded hover:bg-primary-dark dark:bg-darkAccentGreen dark:text-darkBg"
      />
    </FormContainer>
  );
});

export default SafeOpenForm;
