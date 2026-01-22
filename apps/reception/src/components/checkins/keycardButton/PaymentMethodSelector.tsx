/* File: /src/components/checkins/KeycardButton/PaymentMethodSelector.tsx */
import React, { memo } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBan,
  faFileAlt,
  faMoneyBill,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
    <fieldset className="flex flex-col gap-2 dark:text-darkAccentGreen">
      <legend className="font-bold mb-1">Deposit Method</legend>
      <div className="flex justify-around">
        <RadioButton
          label="Cash"
          value={KeycardPayType.CASH}
          icon={faMoneyBill}
          iconClass="text-green-600"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.CASH)}
        />
        <RadioButton
          label="Doc"
          value={KeycardPayType.DOCUMENT}
          icon={faFileAlt}
          iconClass="text-yellow-600"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.DOCUMENT)}
        />
        <RadioButton
          label="No Card"
          value={KeycardPayType.NO_CARD}
          icon={faBan}
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
  icon: IconDefinition;
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
      className={`flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-darkSurface/70 dark:text-darkAccentGreen ${
        isActive ? "bg-gray-200 font-semibold dark:bg-darkSurface" : ""
      }`}
    >
      <input
        type="radio"
        name="payType"
        value={value}
        checked={isActive}
        onChange={onChange}
        className="sr-only"
      />
      <FontAwesomeIcon icon={icon} className={iconClass} />
      {label}
    </label>
  );
});
