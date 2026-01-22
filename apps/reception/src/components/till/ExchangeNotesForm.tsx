import { memo, useState } from "react";
import { z } from "zod";

import {
  useDenominationCalculator,
} from "../../hooks/client/till/useDenominationCalculator";
import { DENOMINATIONS } from "../../types/component/Till";
import { getUserByPin } from "../../utils/getUserByPin";
import { showToast } from "../../utils/toastUtils";
import FormContainer from "../common/FormContainer";
import PinInput from "../common/PinInput";

import { DenominationInput } from "./DenominationInput";

export interface ExchangeNotesFormProps {
  onConfirm: (
    outgoing: Record<string, number>,
    incoming: Record<string, number>,
    direction: "drawerToSafe" | "safeToDrawer",
    total: number
  ) => void;
  onCancel: () => void;
}

const CASH_DENOMS = DENOMINATIONS;

const exchangeNotesFormSchema = z
  .object({
    outTotal: z.number().positive(),
    inTotal: z.number().positive(),
  })
  .refine((data) => data.outTotal === data.inTotal, {
    message: "Totals must match and be greater than zero",
    path: ["inTotal"],
  });

export const ExchangeNotesForm = memo(function ExchangeNotesForm({
  onConfirm,
  onCancel,
}: ExchangeNotesFormProps) {
  const [direction, setDirection] = useState<"drawerToSafe" | "safeToDrawer">(
    "drawerToSafe"
  );
  const {
    denomCounts: outCounts,
    totalDenomValue: outTotal,
    handleDenomChange: handleOut,
  } = useDenominationCalculator(CASH_DENOMS);
  const {
    denomCounts: inCounts,
    totalDenomValue: inTotal,
    handleDenomChange: handleIn,
  } = useDenominationCalculator(CASH_DENOMS);

  const isValid = exchangeNotesFormSchema.safeParse({ outTotal, inTotal }).success;

  const [, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const mapCounts = (counts: number[]): Record<string, number> => {
    const result: Record<string, number> = {};
    CASH_DENOMS.forEach((d, idx) => {
      const c = counts[idx] || 0;
      if (c > 0) result[d.value.toString()] = c;
    });
    return result;
  };

  const handleConfirm = () => {
    const validation = exchangeNotesFormSchema.safeParse({ outTotal, inTotal });
    if (!validation.success) {
      showToast(
        validation.error.errors[0]?.message ??
          "Totals must match and be greater than zero",
        "error"
      );
      return;
    }
    const outMap = mapCounts(outCounts);
    const inMap = mapCounts(inCounts);
    onConfirm(outMap, inMap, direction, outTotal);
  };

  const handlePinChange = (val: string) => {
    setPin(val);
    if (val.length === 6) {
      if (!getUserByPin(val)) {
        setPinError(true);
        return;
      }
      setPinError(false);
      setPin("");
      handleConfirm();
    }
  };

  const title = direction === "drawerToSafe" ? "From Drawer" : "From Safe";

  const toggleLabel =
    direction === "drawerToSafe" ? "Switch to Safe \u2192 Drawer" : "Switch to Drawer \u2192 Safe";

  const description =
    direction === "drawerToSafe"
      ? "Select cash leaving the drawer. This amount will move to the safe."
      : "Select cash leaving the safe. This amount will move to the drawer.";

  return (
    <>
      <FormContainer
        title="Exchange Notes"
        borderColor="border-primary-main"
        onClose={onCancel}
        className="dark:bg-darkSurface"
      >
        <p className="text-sm mb-4 dark:text-darkAccentGreen">{description}</p>
        <button
          className="mb-4 underline text-sm text-info-main dark:text-darkAccentOrange"
          onClick={() =>
            setDirection((prev) =>
              prev === "drawerToSafe" ? "safeToDrawer" : "drawerToSafe"
            )
          }
        >
          {toggleLabel}
        </button>
        <div className="flex flex-col gap-6">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
            <DenominationInput
              denomCounts={
                direction === "drawerToSafe" ? outCounts : inCounts
              }
              handleChange={
                direction === "drawerToSafe" ? handleOut : handleIn
              }
              idPrefix={direction === "drawerToSafe" ? "out_" : "in_"}
              denominations={CASH_DENOMS}
            />
            <p className="text-center font-semibold mt-2">
              Total: €
              {(
                direction === "drawerToSafe" ? outTotal : inTotal
              ).toFixed(2)}
            </p>
          </div>
        </div>
        {!isValid && (
          <div className="text-center text-error-main mt-2">
            Totals must match and be greater than zero.
          </div>
        )}
        <div className="mt-4 flex flex-col items-center gap-2">
          <PinInput onChange={handlePinChange} placeholder="PIN" title="Confirm PIN" />
          {pinError && <div className="text-error-main text-sm">Invalid PIN</div>}
        </div>
      </FormContainer>
    </>
  );
});

export default ExchangeNotesForm;
