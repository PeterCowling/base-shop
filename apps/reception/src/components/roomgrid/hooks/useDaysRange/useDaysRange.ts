// src/libs/reservation-grid/src/lib/hooks/useDaysRange/useDaysRange.ts

import { useMemo } from "react";

// Use centralised date utilities for generating ranges
import { createDaysRange } from "../../../../utils/dateUtils";
import { LOCALES } from "../../constants/locales";
import type { TDaysRange } from "../../interfaces/daysRange.interface";
import type { TLocaleKey } from "../../interfaces/locale.interface";

/**
 * A custom hook that returns a range of days between two dates
 * in a specified locale.
 */
function useDaysRange(
  start: string,
  end: string,
  locale: TLocaleKey
): TDaysRange[] {
  const range = useMemo(() => {
    const options = {
      start,
      end,
      locale: LOCALES[locale],
    };
    return createDaysRange(options);
  }, [start, end, locale]);

  return range;
}

export default useDaysRange;
