/* File: /src/components/checkins/KeycardButton/PaymentMethodSelector.tsx */
import React, { memo } from "react";
import type { LucideIcon } from "lucide-react";
import { Ban, Banknote, FileText } from "lucide-react";

import { Input } from "@acme/design-system";

import { KeycardPayType } from "../../../types/keycards";

/**
 * Radio-group that allows selecting CASH, DOCUMENT, or NO_CARD.
 * Number of cards is always 1 if not NO_CARD, so no separate UI for that.
 */
interface PaymentMethodSelectorProps {
  payType: KeycardPayType;
  setPayType: React.Dispatch<React.SetStateAction<KeycardPayType>>;
}

function PaymentMethodSelector({
  payType,
  setPayType,
}: PaymentMethodSelectorProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-bold mb-1">Deposit Method</legend>
      <div className="flex justify-around">
        <RadioButton
          label="Cash"
          value={KeycardPayType.CASH}
          icon={Banknote}
          iconClass="text-success-main"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.CASH)}
        />
        <RadioButton
          label="Doc"
          value={KeycardPayType.DOCUMENT}
          icon={FileText}
          iconClass="text-warning-main"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.DOCUMENT)}
        />
        <RadioButton
          label="No Card"
          value={KeycardPayType.NO_CARD}
          icon={Ban}
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.NO_CARD)}
        />
      </div>
    </fieldset>
  );
}

export default memo(PaymentMethodSelector);

/* -------------------------------------------------------- */
/* A small sub-component for each radio button in the group */
/* -------------------------------------------------------- */
interface RadioButtonProps {
  label: string;
  value: KeycardPayType;
  icon: LucideIcon;
  iconClass?: string;
  currentValue: KeycardPayType;
  onChange: () => void;
}

const RadioButton = memo(function RadioButton({
  label,
  value,
  icon,
  iconClass,
  currentValue,
  onChange,
}: RadioButtonProps) {
  const isActive = currentValue === value;
  return (
    <label
      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-surface-2 ${
        isActive ? "bg-surface-3 font-semibold" : ""
      }`}
    >
      <Input compatibilityMode="no-wrapper"
        type="radio"
        name="payType"
        value={value}
        checked={isActive}
        onChange={onChange}
        className="sr-only"
      />
      {React.createElement(icon, { size: 16, className: iconClass })}
      {label}
    </label>
  );
});
