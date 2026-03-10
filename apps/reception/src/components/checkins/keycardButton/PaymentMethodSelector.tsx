/* File: /src/components/checkins/KeycardButton/PaymentMethodSelector.tsx */
import React, { memo } from "react";
import { Ban, Banknote, FileText } from "lucide-react";

import { KeycardPayType } from "../../../types/keycards";
import { RadioOption } from "../../common/RadioOption";

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
        <RadioOption<KeycardPayType>
          label="Cash"
          value={KeycardPayType.CASH}
          icon={Banknote}
          iconClass="text-success-main"
          name="payType"
          activeClassName="bg-surface-3 font-semibold"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.CASH)}
        />
        <RadioOption<KeycardPayType>
          label="Doc"
          value={KeycardPayType.DOCUMENT}
          icon={FileText}
          iconClass="text-warning-main"
          name="payType"
          activeClassName="bg-surface-3 font-semibold"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.DOCUMENT)}
        />
        <RadioOption<KeycardPayType>
          label="No Card"
          value={KeycardPayType.NO_CARD}
          icon={Ban}
          name="payType"
          activeClassName="bg-surface-3 font-semibold"
          currentValue={payType}
          onChange={() => setPayType(KeycardPayType.NO_CARD)}
        />
      </div>
    </fieldset>
  );
}

export default memo(PaymentMethodSelector);
