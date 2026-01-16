import { useEffect, useState } from "react";
import { scheduleDailyReset } from "./scheduleDailyReset";
import { z } from "zod";
import { getLocalToday, isToday } from "../../utils/dateUtils";

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
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = StoredData.safeParse(JSON.parse(raw));
        if (parsed.success && isToday(parsed.data.date)) {
          return parsed.data.value;
        }
      }
    } catch {
      // ignore parse errors
    }
    return false;
  });

  // Persist whenever the value changes
  useEffect(() => {
    const data: StoredData = { date: getLocalToday(), value };
    localStorage.setItem(key, JSON.stringify(data));
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
