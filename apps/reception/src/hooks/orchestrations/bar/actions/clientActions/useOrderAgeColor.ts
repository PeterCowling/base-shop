// /Users/petercowling/reception/src/hooks/orchestrations/bar/actions/clientActions/useOrderAgeColor.ts
import { useEffect, useState } from "react";

import { minutesSinceHHMM } from "../../../../../utils/dateUtils";

/**
 * Returns a Tailwind color class, updating every 30 seconds based on the age:
 *  < 7 minutes = bg-success-main
 *  < 12 minutes = bg-warning-main
 *  >= 12 minutes = bg-error-main
 */
export function useOrderAgeColor(orderTime: string): string {
  // State to force re-render every 30 seconds
  const [_tick, setTick] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Directly compute the color class on each render.
  // The component re-renders every 30 seconds due to the _tick state update.
  const diffMinutes = minutesSinceHHMM(orderTime) ?? 0;

  if (diffMinutes < 7) {
    return "bg-success-main";
  } else if (diffMinutes < 12) {
    return "bg-warning-main";
  } else {
    return "bg-error-main";
  }
}
