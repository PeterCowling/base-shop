// File: /src/components/checkins/EmailBookingButton.tsx

import {
  faThLarge, // grid-style icon commonly used to indicate an “app”
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { memo, useCallback, useMemo } from "react";

import CustomTooltip from "./tooltip/CustomTooltip";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import useBookingEmail from "../../services/useBookingEmail";
import { Activity } from "../../types/hooks/data/activitiesData";
import { showToast } from "../../utils/toastUtils";
import { formatEnGbDateTime } from "../../utils/dateUtils";

interface EmailBookingButtonProps {
  bookingRef: string;
  isFirstForBooking: boolean;
  /**
   * Array of occupant activities so we can show
   * when any email-related actions occurred.
   */
  activities?: Activity[];
}

function EmailBookingButton({
  bookingRef,
  isFirstForBooking,
  activities = [],
}: EmailBookingButtonProps) {
  const { guestsDetails, validationError: _guestValErr } = useGuestDetails({
    startAt: bookingRef,
    endAt: bookingRef,
  });
  const { sendBookingEmail, loading } = useBookingEmail();
  const { logActivity } = useActivitiesMutations();

  // Only show timestamps for the initial booking creation (code=1)
  // and when the booking email was sent (code=26).
  const EMAIL_CODES = useMemo<number[]>(() => [1, 26], []);

  const emailTimes = useMemo<string[]>(() => {
    const times = activities
      .filter((a) => EMAIL_CODES.includes(a.code) && Boolean(a.timestamp))
      .map((a) =>
        formatEnGbDateTime(new Date(a.timestamp as string), {
          dateStyle: "short",
          timeStyle: "short",
        })
      );

    // Remove duplicate timestamps so each unique send time is displayed once
    return Array.from(new Set(times));
  }, [activities, EMAIL_CODES]);

  const handleClick = useCallback(async () => {
    const details = guestsDetails[bookingRef];
    if (!details) return;

    const emailMap: Record<string, string> = {};
    Object.entries(details).forEach(([occId, d]) => {
      if (d.email) emailMap[occId] = d.email;
    });

    try {
      await sendBookingEmail(bookingRef, emailMap);
      // Log activity 26 for each occupant we emailed
      await Promise.all(
        Object.keys(emailMap).map((occId) => logActivity(occId, 26))
      );
      showToast("Email sent", "success");
    } catch {
      showToast("Failed to send email", "error");
    }
  }, [bookingRef, guestsDetails, sendBookingEmail, logActivity]);

  if (!isFirstForBooking) return <></>;

  const tooltipContent = (
    <div className="text-sm">
      {emailTimes.length > 0 ? (
        emailTimes.map((t) => <div key={t}>{t}</div>)
      ) : (
        <div>No previous emails</div>
      )}
    </div>
  );

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="min-h-[55px] px-4 bg-primary-main text-white rounded-md hover:bg-primary-dark transition-colors flex items-center justify-center"
        title="Send booking details"
      >
        {loading ? "..." : <FontAwesomeIcon icon={faThLarge} size="lg" />}
      </button>

      {/* --- “i” badge centred horizontally at the top of the button --- */}
      <CustomTooltip
        title={tooltipContent}
        placement="left" /* display tooltip on the left side of the icon */
      >
        <span
          className={[
            "absolute top-0 left-1/2",
            "-translate-x-8 -translate-y-8",
            "w-4 h-4 rounded-full bg-warning-main text-white",
            "flex items-center justify-center text-[10px] cursor-default select-none",
          ].join(" ")}
        >
          i
        </span>
      </CustomTooltip>
    </div>
  );
}

export default memo(EmailBookingButton);
