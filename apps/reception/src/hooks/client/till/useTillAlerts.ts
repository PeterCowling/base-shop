import { useTillShiftContext } from "./TillShiftProvider";

export function useTillAlerts() {
  const till = useTillShiftContext();
  return {
    isDrawerOverLimit: till.isDrawerOverLimit,
    isTillOverMax: till.isTillOverMax,
    pinRequiredForTenderRemoval: till.pinRequiredForTenderRemoval,
  } as const;
}
