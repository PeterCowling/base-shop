// File: /Users/petercowling/reception/src/components/checkins/StatusButton.tsx

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBed,
  faClock,
  faShoppingBag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useMemo, useState } from "react";

import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import { CheckInRow } from "../../types/component/CheckinRow";

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
  25: "Cancelled",
  26: "Resend app email",
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
      // "Check-in complete" => greenish
      return "bg-success-light text-white cursor-pointer hover:opacity-80";
    }
    if (code === 23) {
      // "Bags dropped" => a warning color
      return "bg-warning-main text-white hover:opacity-80";
    }
    // default or no code => normal
    return "bg-primary-main text-white hover:bg-primary-dark";
  }, []);

  /**
   * Pick the button icon from occupant's code.
   */
  const getStatusIcon = useCallback((code: number): IconDefinition => {
    switch (code) {
      case 23:
        return faShoppingBag; // "Bags dropped"
      case 12:
        return faBed; // "Check-in complete"
      default:
        return faClock; // "Pending" or code=0
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
    px-4 py-2
    rounded-md
    shadow
    flex
    items-center
    justify-center
    transition-all
    duration-300
    disabled:opacity-60
    disabled:cursor-not-allowed
    min-h-[55px]
    min-w-[55px]
  `;

  /**
   * Renders occupant's status toggling button.
   */
  return (
    <>
      <button
        onClick={handleStatusChange}
        disabled={isDisabled}
        className={buttonClass}
        title={activityCodes[occupantCode] || "Pending"}
        aria-label={`Status: ${activityCodes[occupantCode] || "Pending"}`}
      >
        {loading ? (
          // spinner
          <svg
            className="animate-spin h-5 w-5 transition-opacity duration-300"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 018 8"
            />
          </svg>
        ) : (
          <FontAwesomeIcon
            icon={getStatusIcon(occupantCode)}
            size="lg"
            className="transition-opacity duration-300"
          />
        )}
      </button>
    </>
  );
}

export default memo(StatusButton);
