// File: /src/components/checkins/EmailBookingButton.tsx

import { memo, useCallback, useMemo } from "react";
import { LayoutGrid } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import useGuestDetails from "../../hooks/data/useGuestDetails";
import useActivitiesMutations from "../../hooks/mutations/useActivitiesMutations";
import useBookingEmail from "../../services/useBookingEmail";
import { type Activity } from "../../types/hooks/data/activitiesData";
import { formatEnGbDateTime } from "../../utils/dateUtils";
import { showToast } from "../../utils/toastUtils";

import CustomTooltip from "./tooltip/CustomTooltip";

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
  // and when the booking email draft was created (code=26).
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
      // Log activity 26 for each occupant included in the draft
      await Promise.all(
        Object.keys(emailMap).map((occId) => logActivity(occId, 26))
      );
      showToast("Email draft created", "success");
    } catch {
      showToast("Failed to create email draft", "error");
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
      <Button
        compatibilityMode="passthrough"
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="h-9 w-9 bg-primary-main/100 text-primary-fg/100 rounded-md hover:opacity-90 transition-colors"
        title="Create booking email draft"
      >
        {loading ? "..." : <LayoutGrid size={20} />}
      </Button>

      {/* info badge — top-right corner of button */}
      <CustomTooltip
        title={tooltipContent}
        placement="left"
      >
        <Inline
          gap={0}
          wrap={false}
          className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-warning-main/100 text-primary-fg/100 text-10px cursor-default select-none justify-center"
        >
          <span>i</span>
        </Inline>
      </CustomTooltip>
    </div>
  );
}

export default memo(EmailBookingButton);
