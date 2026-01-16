import React, { useEffect } from "react";

import { useCompletedOrder } from "../../hooks/data/bar/useCompletedOrder";
import {
  PlacedPreorder,
  usePlacedPreorder,
} from "../../hooks/data/bar/usePlacedPreorder";
import {
  addDays,
  formatDate,
  parseLocalDate,
  formatMonthNameDay,
} from "../../utils/dateUtils";

// ----------------------------------------------------------------
// Utility
// ----------------------------------------------------------------
function getNightIndex(nightKey: string): number {
  const match = nightKey.match(/^night(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

// no local helpers

// ----------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------
type NightData = {
  breakfast?: string; // e.g. "txn_..." or "NA"
  drink1?: string; // e.g. "txn_..." or "NA"
  drink2?: string; // e.g. "txn_..." or "NA"
};

interface CompletedOrderData {
  time: string;
  items: {
    product: string;
    count?: number;
  }[];
}

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
  const evDrinkIso = evDrinkDate ? formatDate(evDrinkDate) : "";

  const breakfastDate =
    checkInDateObj && nightIndex ? addDays(checkInDateObj, nightIndex) : null;
  const breakfastIso = breakfastDate ? formatDate(breakfastDate) : "";

  const evDrinkDateObj = parseLocalDate(evDrinkIso);
  const { day: evDrinkDay, month: evDrinkMonth } = evDrinkDateObj
    ? formatMonthNameDay(evDrinkDateObj)
    : { day: "", month: "" };
  const breakfastDateObj = parseLocalDate(breakfastIso);
  const { day: breakfastDay, month: breakfastMonth } = breakfastDateObj
    ? formatMonthNameDay(breakfastDateObj)
    : { day: "", month: "" };

  const breakfastTxnId = nightValue.breakfast?.startsWith("txn_")
    ? nightValue.breakfast
    : null;
  const drink1TxnId = nightValue.drink1?.startsWith("txn_")
    ? nightValue.drink1
    : null;
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

  const breakfastPlacedData = breakfastPlaced.data as PlacedPreorder | null;
  const drinkPlacedData1 = drink1Placed.data as PlacedPreorder | null;
  const drinkPlacedData2 = drink2Placed.data as PlacedPreorder | null;
  const breakfastPlacedLoading = breakfastPlaced.loading;
  const drinkPlacedLoading1 = drink1Placed.loading;
  const drinkPlacedLoading2 = drink2Placed.loading;

  // If invalid nightIndex or missing checkInDate, show a basic summary.
  if (!nightIndex || !checkInDateObj) {
    return (
      <div className="border p-2 mb-3 rounded">
        <p className="font-semibold">Night: {nightKey}</p>
        <p>Breakfast: {fallbackBreakfast}</p>
        <p>Drink1: {fallbackDrink1}</p>
        <p>Drink2: {fallbackDrink2}</p>{" "}
      </div>
    );
  }

  // Normal valid scenario
  const breakfastData = breakfastRes.data as CompletedOrderData | null;
  const drinkData1 = drink1Res.data as CompletedOrderData | null;
  const drinkData2 = drink2Res.data as CompletedOrderData | null;

  const breakfastLoading = breakfastRes.loading;
  const drinkLoading1 = drink1Res.loading;
  const drinkLoading2 = drink2Res.loading;

  return (
    <div className="border p-2 mb-3 rounded">
      <p className="font-semibold">Night: {nightKey}</p>

      {/* Breakfast */}
      {breakfastTxnId ? (
        breakfastLoading ? (
          <p>Loading Breakfast Order...</p>
        ) : breakfastData ? (
          <div className="mt-2">
            <p className="font-semibold">
              Breakfast Preorder ({breakfastMonth} {breakfastDay}):
            </p>
            <p>Time: {breakfastData.time}</p>
            {Array.isArray(breakfastData.items) &&
              breakfastData.items.map((item) => (
                <p key={item.product}>• {item.product}</p>
              ))}
          </div>
        ) : breakfastPlacedLoading ? (
          <p>Loading Breakfast Preorder...</p>
        ) : breakfastPlacedData ? (
          <div className="mt-2">
            <p className="font-semibold">
              Pending Breakfast Preorder ({breakfastMonth} {breakfastDay}):
            </p>
            <p>Time: {breakfastPlacedData.preorderTime}</p>
            {Array.isArray(breakfastPlacedData.items) &&
              breakfastPlacedData.items.map((item) => (
                <p key={item.product}>• {item.product}</p>
              ))}
          </div>
        ) : (
          <p>Breakfast transaction not found.</p>
        )
      ) : (
        <p>Breakfast: {fallbackBreakfast}</p>
      )}

      {/* Drink1 */}
      {drink1TxnId ? (
        drinkLoading1 ? (
          <p>Loading Drink1 Order...</p>
        ) : drinkData1 ? (
          <div className="mt-2">
            <p className="font-semibold">
              Evening Drink #1 ({evDrinkMonth} {evDrinkDay}):
            </p>
            <p>Time: {drinkData1.time}</p>
            {Array.isArray(drinkData1.items) &&
              drinkData1.items.map((item) => (
                <p key={item.product}>
                  •{" "}
                  {item.count && item.count > 1
                    ? `${item.count} × ${item.product}`
                    : item.product}
                </p>
              ))}
          </div>
        ) : drinkPlacedLoading1 ? (
          <p>Loading Drink1 Preorder...</p>
        ) : drinkPlacedData1 ? (
          <div className="mt-2">
            <p className="font-semibold">
              Pending Drink #1 Preorder ({evDrinkMonth} {evDrinkDay}):
            </p>
            <p>Time: {drinkPlacedData1.preorderTime}</p>
            {Array.isArray(drinkPlacedData1.items) &&
              drinkPlacedData1.items.map((item) => (
                <p key={item.product}>
                  •{" "}
                  {item.count && item.count > 1
                    ? `${item.count} × ${item.product}`
                    : item.product}
                </p>
              ))}
          </div>
        ) : (
          <p>Drink1 transaction not found.</p>
        )
      ) : (
        <p>Drink1: {fallbackDrink1}</p>
      )}

      {/* Drink2 */}
      {drink2TxnId ? (
        drinkLoading2 ? (
          <p>Loading Drink2 Order...</p>
        ) : drinkData2 ? (
          <div className="mt-2">
            <p className="font-semibold">
              Evening Drink #2 ({evDrinkMonth} {evDrinkDay}):
            </p>
            <p>Time: {drinkData2.time}</p>
            {Array.isArray(drinkData2.items) &&
              drinkData2.items.map((item) => (
                <p key={item.product}>
                  •{" "}
                  {item.count && item.count > 1
                    ? `${item.count} × ${item.product}`
                    : item.product}
                </p>
              ))}
          </div>
        ) : drinkPlacedLoading2 ? (
          <p>Loading Drink2 Preorder...</p>
        ) : drinkPlacedData2 ? (
          <div className="mt-2">
            <p className="font-semibold">
              Pending Drink #2 Preorder ({evDrinkMonth} {evDrinkDay}):
            </p>
            <p>Time: {drinkPlacedData2.preorderTime}</p>
            {Array.isArray(drinkPlacedData2.items) &&
              drinkPlacedData2.items.map((item) => (
                <p key={item.product}>
                  •{" "}
                  {item.count && item.count > 1
                    ? `${item.count} × ${item.product}`
                    : item.product}
                </p>
              ))}
          </div>
        ) : (
          <p>Drink2 transaction not found.</p>
        )
      ) : (
        <p>Drink2: {fallbackDrink2}</p>
      )}
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
  // Optionally close on "Escape" key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // If occupant has no preorder node, show nothing.
  if (!preorder) {
    return null;
  }

  // Parse occupantCheckIn once
  const checkInDateObj = parseLocalDate(occupantCheckIn);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 dark:bg-darkBg/80"
      role="button"
      tabIndex={0}
      // Close only if the user clicked exactly on the backdrop
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }
      }}
    >
      <div
        className="bg-white p-6 rounded shadow-xl max-w-lg w-full relative max-h-screen overflow-y-auto dark:bg-darkSurface dark:text-darkAccentGreen"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 dark:text-darkAccentGreen"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Preorders for {guestName}</h2>
        {!checkInDateObj && (
          <p className="text-red-500 mb-2 dark:text-darkAccentOrange">
            Invalid checkInDate: <strong>{occupantCheckIn}</strong>
          </p>
        )}

        {/* Render each night's details */}
        {Object.entries(preorder).map(([nightKey, nightValue]) => (
          <PreorderNightDetails
            key={nightKey}
            nightKey={nightKey}
            nightValue={nightValue}
            checkInDateObj={checkInDateObj}
          />
        ))}
      </div>
    </div>
  );
};

export default ModalPreorderDetails;
