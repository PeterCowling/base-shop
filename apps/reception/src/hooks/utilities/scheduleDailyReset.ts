// src/hooks/utilities/scheduleDailyReset.ts
//
// Helper that invokes a callback at the next local midnight and then
// reschedules itself for subsequent midnights. The returned timer id
// can be cleared to cancel the current scheduled callback.

import { msUntilNextMidnight } from "../../utils/dateUtils";

export type DailyResetTimer = ReturnType<typeof setTimeout>;

export function scheduleDailyReset(cb: () => void | Promise<void>): DailyResetTimer {
  function schedule(): DailyResetTimer {
    const ms = msUntilNextMidnight();
    return setTimeout(() => {
      void cb();
      schedule();
    }, ms + 1000);
  }
  return schedule();
}
