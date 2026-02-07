/* File: /src/components/checkins/Tooltip.tsx */
import { memo } from "react";

import type { MealPlan } from "../../../types/hooks/data/mealPlan";

import CustomTooltip from "./CustomTooltip";

interface Room {
  booked?: string | number;
  allocated?: string | number;
}

interface PersonalDetails {
  firstName?: string;
  lastName?: string;
  reservationCode?: string;
  room?: Room;
}

export interface Booking {
  personalDetails: PersonalDetails;
  mealPlans?: MealPlan;
  notes?: string;
}

interface TooltipComponentProps {
  booking: Booking;
  onDoubleClick?: React.MouseEventHandler<HTMLSpanElement>;
}

export function getAllocationType(
  booked: string | number | undefined,
  allocated: string | number | undefined
): "same-grade" | "side-grade" | "upgrade" {
  if (booked === allocated) return "same-grade";

  // Example side-grade checks
  const sideGrades: [number, number][] = [
    [6, 5],
    [5, 6],
    [3, 4],
    [4, 3],
  ];
  const isSideGrade = sideGrades.some(
    (pair) => pair.includes(Number(booked)) && pair.includes(Number(allocated))
  );
  return isSideGrade ? "side-grade" : "upgrade";
}

function TooltipComponent({ booking, onDoubleClick }: TooltipComponentProps) {
  const { personalDetails = {}, notes } = booking;
  const { reservationCode, room, firstName, lastName } = personalDetails;

  const allocationType = getAllocationType(room?.booked, room?.allocated);

  const tooltipContent = (
    <div
      className="text-sm z-50"
      style={{ zIndex: 9999 }} // Ensure the tooltip appears on top
    >
      <p>
        <strong>Booking Ref: {reservationCode || "N/A"}</strong>
      </p>
      {booking.mealPlans?.level && (
        <p>
          <strong>Meal Plan Level: {booking.mealPlans.level}</strong>
        </p>
      )}
      {booking.mealPlans?.type && (
        <p>
          <strong>Meal Plan Type: {booking.mealPlans.type}</strong>
        </p>
      )}
      {allocationType === "upgrade" && (
        <p>
          <strong>
            Room Upgrade to: {room?.allocated} from {room?.booked}
          </strong>
        </p>
      )}
      {allocationType === "side-grade" && (
        <p>
          <strong>Room Side-grade to: {room?.allocated}</strong>
        </p>
      )}
      {notes && (
        <p>
          <strong>Notes: {notes}</strong>
        </p>
      )}
    </div>
  );

  const displayName = `${firstName || ""} ${lastName || ""}`.trim() || "Guest";

  return (
    <>
      {/* A container ensuring the tooltip can float above other elements */}
      <div className="relative z-50" style={{ zIndex: 9999 }}>
        <CustomTooltip title={tooltipContent} style={{ marginLeft: "100px" }}>
          {/* The name with potential highlight on hover */}
          <span
            tabIndex={0}
            role="button"
            className="
              inline-block
              cursor-pointer
              px-2 py-1
              rounded
              hover:bg-black
              hover:bg-opacity-5
              focus:outline-none
            "
            onDoubleClick={onDoubleClick}
          >
            {displayName}
          </span>
        </CustomTooltip>
      </div>
    </>
  );
}

export default memo(TooltipComponent);
