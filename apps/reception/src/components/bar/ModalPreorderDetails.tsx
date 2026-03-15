import React from "react";

import { SimpleModal } from "@acme/ui/molecules";

import { useCompletedOrder } from "../../hooks/data/bar/useCompletedOrder";
import { usePlacedPreorder } from "../../hooks/data/bar/usePlacedPreorder";
import type { PlacedPreorder } from "../../types/bar/BarTypes";
import {
  addDays,
  formatMonthNameDay,
  parseLocalDate,
} from "../../utils/dateUtils";

// ----------------------------------------------------------------
// Utility
// ----------------------------------------------------------------
function getNightIndex(nightKey: string): number {
  const match = nightKey.match(/^night(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

// ----------------------------------------------------------------
// OrderItemDisplay — shared render for breakfast / drink slots
// ----------------------------------------------------------------
type CompletedOrderData = {
  time: string;
  items: { product: string; count?: number }[];
};

const OrderItemDisplay: React.FC<{
  label: string;
  dateMonth: string;
  dateDay: string;
  txnId: string | null;
  completedData: CompletedOrderData | null;
  completedLoading: boolean;
  placedData: PlacedPreorder | null;
  placedLoading: boolean;
  fallback: string;
  showItemCount?: boolean;
}> = ({
  label,
  dateMonth,
  dateDay,
  txnId,
  completedData,
  completedLoading,
  placedData,
  placedLoading,
  fallback,
  showItemCount = false,
}) => {
  if (!txnId) return <p>{label}: {fallback}</p>;
  if (completedLoading) return <p>Loading {label} Order...</p>;
  if (completedData) {
    return (
      <div className="mt-2">
        <p className="font-semibold">{label} ({dateMonth} {dateDay}):</p>
        <p>Time: {completedData.time}</p>
        {Array.isArray(completedData.items) &&
          completedData.items.map((item) => (
            <p key={item.product}>
              • {showItemCount && item.count && item.count > 1
                ? `${item.count} × ${item.product}`
                : item.product}
            </p>
          ))}
      </div>
    );
  }
  if (placedLoading) return <p>Loading {label} Preorder...</p>;
  if (placedData) {
    return (
      <div className="mt-2">
        <p className="font-semibold">Pending {label} Preorder ({dateMonth} {dateDay}):</p>
        <p>Time: {placedData.preorderTime}</p>
        {Array.isArray(placedData.items) &&
          placedData.items.map((item) => (
            <p key={item.product}>
              • {showItemCount && item.count && item.count > 1
                ? `${item.count} × ${item.product}`
                : item.product}
            </p>
          ))}
      </div>
    );
  }
  return <p>{label} transaction not found.</p>;
};

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
type NightData = {
  breakfast?: string;
  drink1?: string;
  drink2?: string;
  /** txnId backref for breakfast — set by Prime bridge write; breakfast field keeps entitlement value */
  breakfastTxnId?: string;
  /** txnId backref for evening drink — set by Prime bridge write; drink1 field keeps entitlement value */
  drink1Txn?: string;
};

type ModalPreorderDetailsProps = {
  occupantCheckIn: string; // e.g. "2025-03-20"
  guestName: string;
  preorder: { [nightKey: string]: NightData } | null;
  onClose: () => void;
};

// ----------------------------------------------------------------
// Child Component
// ----------------------------------------------------------------
const PreorderNightDetails: React.FC<{
  nightKey: string;
  nightValue: NightData;
  checkInDateObj?: Date;
}> = ({ nightKey, nightValue, checkInDateObj }) => {
  const nightIndex = getNightIndex(nightKey);

  // Always compute and call hooks (avoid conditional hooks).
  const fallbackBreakfast = nightValue.breakfast || "NA";
  const fallbackDrink1 = nightValue.drink1 || "NA";
  const fallbackDrink2 = nightValue.drink2 || "NA";

  const evDrinkDate =
    checkInDateObj && nightIndex
      ? addDays(checkInDateObj, nightIndex - 1)
      : null;
  const breakfastDate =
    checkInDateObj && nightIndex ? addDays(checkInDateObj, nightIndex) : null;

  const { day: evDrinkDay, month: evDrinkMonth } = evDrinkDate
    ? formatMonthNameDay(evDrinkDate)
    : { day: "", month: "" };
  const { day: breakfastDay, month: breakfastMonth } = breakfastDate
    ? formatMonthNameDay(breakfastDate)
    : { day: "", month: "" };

  // Prime bridge write stores txnIds in breakfastTxnId / drink1Txn (not in breakfast / drink1).
  const breakfastTxnId = nightValue.breakfastTxnId ?? null;
  const drink1TxnId = nightValue.drink1Txn ?? null;
  const drink2TxnId = nightValue.drink2?.startsWith("txn_")
    ? nightValue.drink2
    : null;

  const breakfastRes = useCompletedOrder(breakfastTxnId);
  const drink1Res = useCompletedOrder(drink1TxnId);
  const drink2Res = useCompletedOrder(drink2TxnId);

  const breakfastPlaced = usePlacedPreorder(
    "breakfast",
    breakfastMonth,
    breakfastDay,
    breakfastTxnId
  );
  const drink1Placed = usePlacedPreorder(
    "evDrink",
    evDrinkMonth,
    evDrinkDay,
    drink1TxnId
  );
  const drink2Placed = usePlacedPreorder(
    "evDrink",
    evDrinkMonth,
    evDrinkDay,
    drink2TxnId
  );

  // If invalid nightIndex or missing checkInDate, show a basic summary.
  if (!nightIndex || !checkInDateObj) {
    return (
      <div className="border border-border-1 p-2 mb-3 rounded-lg">
        <p className="font-semibold">Night: {nightKey}</p>
        <p>Breakfast: {fallbackBreakfast}</p>
        <p>Drink1: {fallbackDrink1}</p>
        <p>Drink2: {fallbackDrink2}</p>
      </div>
    );
  }

  return (
    <div className="border border-border-1 p-2 mb-3 rounded-lg">
      <p className="font-semibold">Night: {nightKey}</p>

      <OrderItemDisplay
        label="Breakfast"
        dateMonth={breakfastMonth}
        dateDay={breakfastDay}
        txnId={breakfastTxnId}
        completedData={breakfastRes.data as CompletedOrderData | null}
        completedLoading={breakfastRes.loading}
        placedData={breakfastPlaced.data as PlacedPreorder | null}
        placedLoading={breakfastPlaced.loading}
        fallback={fallbackBreakfast}
      />
      <OrderItemDisplay
        label="Evening Drink #1"
        dateMonth={evDrinkMonth}
        dateDay={evDrinkDay}
        txnId={drink1TxnId}
        completedData={drink1Res.data as CompletedOrderData | null}
        completedLoading={drink1Res.loading}
        placedData={drink1Placed.data as PlacedPreorder | null}
        placedLoading={drink1Placed.loading}
        fallback={fallbackDrink1}
        showItemCount
      />
      <OrderItemDisplay
        label="Evening Drink #2"
        dateMonth={evDrinkMonth}
        dateDay={evDrinkDay}
        txnId={drink2TxnId}
        completedData={drink2Res.data as CompletedOrderData | null}
        completedLoading={drink2Res.loading}
        placedData={drink2Placed.data as PlacedPreorder | null}
        placedLoading={drink2Placed.loading}
        fallback={fallbackDrink2}
        showItemCount
      />
    </div>
  );
};

// ----------------------------------------------------------------
// Main Modal (Pattern A)
// ----------------------------------------------------------------
const ModalPreorderDetails: React.FC<ModalPreorderDetailsProps> = ({
  occupantCheckIn,
  guestName,
  preorder,
  onClose,
}) => {
  // Parse occupantCheckIn once
  const checkInDateObj = parseLocalDate(occupantCheckIn);

  return (
    <SimpleModal
      isOpen={!!preorder}
      onClose={onClose}
      title={`Preorders for ${guestName}`}
      maxWidth="max-w-lg"
    >
      <div className="max-h-screen overflow-y-auto">
        {!checkInDateObj && (
          <p className="text-error-main mb-2">
            Invalid checkInDate: <strong>{occupantCheckIn}</strong>
          </p>
        )}

        {/* Render each night's details */}
        {preorder &&
          Object.entries(preorder).map(([nightKey, nightValue]) => (
            <PreorderNightDetails
              key={nightKey}
              nightKey={nightKey}
              nightValue={nightValue}
              checkInDateObj={checkInDateObj}
            />
          ))}
      </div>
    </SimpleModal>
  );
};

export default ModalPreorderDetails;
