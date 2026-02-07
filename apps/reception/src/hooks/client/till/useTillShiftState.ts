import { useTillShiftContext } from "./TillShiftProvider";

export function useTillShiftState() {
  const till = useTillShiftContext();
  return {
    shiftOpenTime: till.shiftOpenTime,
    shiftOwner: till.shiftOwner,
    previousShiftCloseTime: till.previousShiftCloseTime,
    openingCash: till.openingCash,
    openingKeycards: till.openingKeycards,
    finalCashCount: till.finalCashCount,
    finalKeycardCount: till.finalKeycardCount,
    lastCloseCashCount: till.lastCloseCashCount,
  } as const;
}
