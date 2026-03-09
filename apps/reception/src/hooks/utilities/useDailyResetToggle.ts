import { useEffect, useState } from "react";
import { z } from "zod";

import { readJson, writeJson } from "../../lib/offline/storage";
import { getLocalToday, isToday } from "../../utils/dateUtils";

import { scheduleDailyReset } from "./scheduleDailyReset";

export const StoredData = z.object({
  date: z.string(),
  value: z.boolean(),
});
type StoredData = z.infer<typeof StoredData>;

/**
 * Persists a boolean toggle in localStorage and automatically
 * resets it at local midnight each day.
 */
export default function useDailyResetToggle(
  key: string
): [boolean, (v: boolean) => void] {

  const [value, setValue] = useState<boolean>(() => {
    const parsed = StoredData.safeParse(readJson(key));
    if (parsed.success && isToday(parsed.data.date)) {
      return parsed.data.value;
    }
    return false;
  });

  // Persist whenever the value changes
  useEffect(() => {
    writeJson(key, { date: getLocalToday(), value });
  }, [key, value]);

  // Reset at the next midnight
  useEffect(() => {
    const timer = scheduleDailyReset(() => {
      setValue(false);
    });
    return () => clearTimeout(timer);
  }, []);

  return [value, setValue];
}
