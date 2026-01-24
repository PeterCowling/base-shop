import { memo, useState } from "react";

import { showToast } from "../../utils/toastUtils";
import FormContainer from "../common/FormContainer";
import PasswordReauthInline from "../common/PasswordReauthInline";

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
      <div className="mt-4 flex flex-col gap-3">
        <PasswordReauthInline
          onSubmit={handleConfirm}
          submitLabel="Confirm opening"
        />
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded bg-info-main text-white hover:bg-info-dark dark:bg-darkSurface dark:text-darkAccentOrange"
        >
          Cancel
        </button>
      </div>
    </FormContainer>
  );
});

export default SafeOpenForm;
