/* File: /src/hooks/client/useInactivityLogout.ts */
import { useCallback, useEffect, useRef } from "react";

import { useAuth } from "../../context/AuthContext";

/**
 * Tracks user inactivity (mouse/keyboard/touch/scroll) and calls the `onLogout`
 * callback after the specified timeout (default: 30 seconds).
 *
 * If the current user's name is "Cristiana", this hook will not apply any inactivity timeout.
 *
 * @param isUserLoggedIn - Whether the user is currently logged in
 * @param onLogout - Function to call when logout is required
 * @param timeoutMs - Inactivity period in milliseconds (default: 30000)
 */
export default function useInactivityLogout(
  isUserLoggedIn: boolean,
  onLogout: () => void,
  timeoutMs = 30000
): void {
  const { user } = useAuth();
  const username = user?.user_name;

  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Records activity by updating the timestamp of the last interaction.
  const recordActivity = useCallback((): void => {
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * Attaches global event listeners and periodically checks for inactivity.
   */
  useEffect(() => {
    if (!isUserLoggedIn || username === "Cristiana") return;

    // Record activity on mount so the timer starts now
    recordActivity();

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity);
    });

    intervalRef.current = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= timeoutMs) {
        onLogout();
      }
    }, timeoutMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
    };
  }, [isUserLoggedIn, username, timeoutMs, onLogout, recordActivity]);
}
