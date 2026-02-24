import { useState } from "react";

import { ReceptionButton as Button } from "@acme/ui/operations";

import { withModalBackground } from "../../hoc/withModalBackground";
import ModalContainer from "../bar/orderTaking/modal/ModalContainer";

import PinInput from "./PinInput";

export interface PinEntryModalProps {
  title: string;
  instructions?: string;
  onSubmit: (pin: string) => boolean | Promise<boolean>;
  onCancel: () => void;
  hideCancel?: boolean;
}

function PinEntryModalBase({
  title,
  instructions,
  onSubmit,
  onCancel,
  hideCancel,
}: PinEntryModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const ok = await onSubmit(pin);
    if (!ok) {
      setError("Invalid PIN");
    }
  };

  return (
    <ModalContainer widthClasses="w-80">
      <h2 className="text-xl font-semibold mb-4 text-center dark:text-darkAccentGreen">{title}</h2>
      {instructions && (
        <p className="text-center mb-4 text-sm text-foreground dark:text-darkAccentGreen">{instructions}</p>
      )}
      <div className="mt-4">
        <PinInput onChange={setPin} placeholder={title} />
      </div>
      {error && <div className="mb-2 text-error-main text-sm">{error}</div>}
      <div className="flex justify-center gap-2 mt-4">
        {!hideCancel && (
          <Button
            onClick={onCancel}
            className="px-4 py-2 rounded bg-surface-3 text-foreground dark:bg-darkSurface dark:text-darkAccentOrange"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          className="px-4 py-2 rounded bg-primary-main text-primary-fg dark:bg-darkAccentGreen"
        >
          Confirm
        </Button>
      </div>
    </ModalContainer>
  );
}

PinEntryModalBase.displayName = "PinEntryModalBase";

export default withModalBackground(PinEntryModalBase);
