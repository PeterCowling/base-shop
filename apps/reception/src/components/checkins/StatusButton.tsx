// File: /Users/petercowling/reception/src/components/checkins/StatusButton.tsx

import { memo, useCallback, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Bed, Clock, ShoppingBag } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import { type CheckInRow } from "../../types/component/CheckinRow";
import { Spinner } from "../common/Spinner";

/**
 * Known activity codes for display hints
 */
const activityCodes: Record<number, string> = {
  1: "Booking created",
  2: "First reminder",
  3: "Second reminder",
  4: "Auto-cancel no T&C",
  5: "Failed room payment (1)",
  6: "Failed room payment (2)",
  7: "Auto-cancel no payment",
  8: "Room payment made",
  9: "City tax payment",
  10: "Keycard deposit made",
  11: "Document details taken",
  12: "Check-in complete",
  13: "Keycard refund made",
  14: "Checkout complete",
  15: "Bag drop T&C",
  16: "Bags picked up",
  17: "Room upgrade",
  18: "Room move",
  19: "Arrival data change",
  20: "Room extension",
  21: "Agreed to non-refundable T&C",
  22: "System generated cancellation",
  23: "Bags dropped",
  24: "Departure date change",
  25: "Deleted",
  26: "App email draft created",
};

interface StatusButtonProps {
  /** The occupant-level booking info, including the activities array. */
  booking: CheckInRow;
}

/**
 * Utility for computing how many times occupant has logged
 * code=12 or code=23. Each instance is one toggle in our local "cycle."
 * 0 => occupant code 0 (no logs)
 * 1 => occupant code 23
 * 2 => occupant code 12
 * 3 => occupant code 23
 * 4 => occupant code 0
 * 5 => occupant code 23
 * etc.
 */
function calculateToggles(activities: CheckInRow["activities"]): number {
  if (!activities || !activities.length) return 0;
  // Count how many 12 or 23 codes exist
  return activities.reduce((acc, act) => {
    return act.code === 12 || act.code === 23 ? acc + 1 : acc;
  }, 0);
}

/**
 * Determine occupant code in the cycle based on toggles mod 4:
 *  - 0 mod 4 => code=0 (not arrived)
 *  - 1 mod 4 => code=23 (bags dropped, added)
 *  - 2 mod 4 => code=12 (checked in)
 *  - 3 mod 4 => code=23 (bags dropped, but from removing code=12)
 */
function getCodeFromToggles(toggles: number): number {
  const remainder = toggles % 4;
  if (remainder === 0) return 0;
  if (remainder === 2) return 12;
  // remainder 1 or 3 => code=23
  return 23;
}

/**
 * StatusButton cycles occupant's state among:
 *  0 -> 23 -> 12 -> 23 -> 0 -> ...
 * Each odd click (from code=0) adds code=23,
 * next click adds code=12,
 * next click removes code=12,
 * next click removes code=23,
 * and so on.
 * This matches the request to keep toggling forever.
 */
function StatusButton({ booking }: StatusButtonProps) {
  const occupantId = booking.occupantId;
  const { addActivity, removeLastActivity, loading } = useActivitiesMutations();

  /**
   * We'll store how many total logs (12 or 23) occupant currently has.
   * Then occupant code = toggles mod 4 => 0, 23, or 12.
   */
  const [toggles, setToggles] = useState<number>(() =>
    calculateToggles(booking.activities)
  );

  /**
   * NOTE: We intentionally avoid resetting the local `toggles` state when
   * `booking.activities` change.  The previous implementation recomputed the
   * toggle count from the activities after each mutation which meant the count
   * never progressed past the number of existing activity logs.  As a result the
   * cycle would bounce between codes 23 and 12 and never reach code 0.
   *
   * By only initialising the toggle count from `booking.activities` once we can
   * keep incrementing it on every click.  This allows the state to progress
   * through the full sequence:
   *   0 → 23 → 12 → 23 → 0 → …
   */

  /**
   * Occupant's current code in the cycle.
   */
  const occupantCode = useMemo(() => getCodeFromToggles(toggles), [toggles]);

  /**
   * Choose the button style by occupant's current code.
   */
  const getButtonStyle = useCallback((code: number): string => {
    if (code === 12) {
      // "Check-in complete" — success green; light text for contrast on dark bg
      return "bg-success-main/100 text-foreground cursor-pointer hover:opacity-80";
    }
    if (code === 23) {
      // "Bags dropped" — warning amber; light text for contrast on dark bg
      return "bg-warning-main/100 text-foreground hover:opacity-80";
    }
    // code=0 => not yet arrived — muted inactive state
    return "bg-surface-3 text-foreground/60 hover:opacity-90";
  }, []);

  /**
   * Pick the button icon from occupant's code.
   */
  const getStatusIcon = useCallback((code: number): LucideIcon => {
    switch (code) {
      case 23:
        return ShoppingBag; // "Bags dropped"
      case 12:
        return Bed; // "Check-in complete"
      default:
        return Clock; // "Pending" or code=0
    }
  }, []);

  /**
   * Whenever user clicks, we advance toggles by +1.
   * Then we figure out which code we are leaving -> which code we are going to.
   * - If going from 0 to 23 => addActivity(23)
   * - If going from 23 to 12 => addActivity(12)
   * - If going from 12 to 23 => removeLastActivity(12)
   * - If going from 23 to 0 => removeLastActivity(23)
   *
   * This yields the infinite cycle: 0->23->12->23->0->23->12->...
   */
  const handleStatusChange = useCallback(async () => {
    if (!occupantId) return;

    const oldCode = occupantCode;
    const newToggles = toggles + 1;
    const newCode = getCodeFromToggles(newToggles);

    // We'll optimistically update toggles so UI doesn't flicker.
    setToggles(newToggles);

    try {
      // Evaluate which operation is needed based on the transition.
      // oldCode -> newCode
      if (oldCode === 0 && newCode === 23) {
        // add code=23
        await addActivity(occupantId, 23);
      } else if (oldCode === 23 && newCode === 12) {
        // add code=12
        await addActivity(occupantId, 12);
      } else if (oldCode === 12 && newCode === 23) {
        // remove last code=12
        await removeLastActivity(occupantId, 12);
      } else if (oldCode === 23 && newCode === 0) {
        // remove last code=23
        await removeLastActivity(occupantId, 23);
      }
      // No other transitions needed (the cycle only uses 0, 23, 12).
    } catch (err) {
      console.error("Failed to update occupant's activity:", err);
      // revert toggles if DB update fails
      setToggles(toggles);
    }
  }, [occupantId, occupantCode, toggles, addActivity, removeLastActivity]);

  /**
   * The button is never truly "disabled" in this new logic.
   * If you wanted to prevent changes under certain conditions, you could adapt this.
   */
  const isDisabled = false;

  /**
   * Combine dynamic and static classes for button styling.
   */
  const buttonClass = `
    ${getButtonStyle(occupantCode)}
    h-9 w-9
    rounded-md
    flex
    items-center
    justify-center
    transition-all
    duration-200
    disabled:opacity-60
    disabled:cursor-not-allowed
  `;

  /**
   * Renders occupant's status toggling button.
   */
  return (
    <>
      <Button
        compatibilityMode="passthrough"
        onClick={handleStatusChange}
        disabled={isDisabled}
        className={buttonClass}
        title={activityCodes[occupantCode] || "Pending"}
        aria-label={`Status: ${activityCodes[occupantCode] || "Pending"}`}
      >
        {loading ? (
          <Spinner size="sm" className="transition-opacity duration-300" />
        ) : (
          (() => {
            const StatusIcon = getStatusIcon(occupantCode);
            return <StatusIcon size={24} className="transition-opacity duration-300" />;
          })()
        )}
      </Button>
    </>
  );
}

export default memo(StatusButton);
