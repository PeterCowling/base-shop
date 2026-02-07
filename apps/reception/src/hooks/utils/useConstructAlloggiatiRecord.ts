import { useCallback } from "react";

import type { OccupantDetails } from "../../types/hooks/data/guestDetailsData";
import { constructAlloggiatiRecord } from "../../utils/constructAlloggiatiRecord";
import { formatDdMmYyyy, getYesterday } from "../../utils/dateUtils";

export function useConstructAlloggiatiRecord() {
  return {
    constructAlloggiatiRecord: useCallback(
      (occupant: OccupantDetails) =>
        constructAlloggiatiRecord(occupant, {
          arrivalDateDdMmYyyy: formatDdMmYyyy(getYesterday()),
          nights: "1",
        }),
      [],
    ),
  };
}

