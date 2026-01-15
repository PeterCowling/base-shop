// src/components/roomgrid/DropCell.tsx

import React, { FC } from "react";
import { useDrop } from "react-dnd";

interface DropCellProps {
  cellDate: string; // e.g. "2025-09-22"
  roomNumber: string; // e.g. "4"
  onDropBooking: (params: {
    occupantId: string;
    bookingRef: string;
    fromRoom: string;
    toRoom: string;
    date: string;
  }) => void;
  children?: React.ReactNode;
}

const DropCell: FC<DropCellProps> = ({
  cellDate,
  roomNumber,
  onDropBooking,
  children,
}) => {
  // Setup drop
  const [{ isOver }, dropRef] = useDrop<
    { occupantId: string; bookingRef: string; date: string; fromRoom: string },
    void,
    { isOver: boolean }
  >({
    accept: "BOOKING",
    drop: (item) => {
      // Only accept if date matches exactly
      if (item.date === cellDate) {
        onDropBooking({
          occupantId: item.occupantId,
          bookingRef: item.bookingRef,
          fromRoom: item.fromRoom,
          toRoom: roomNumber,
          date: item.date,
        });
      } else {
        // Optionally show an alert or notification
        alert(
          `Cannot drop booking from date ${item.date} into date ${cellDate}.`
        );
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const borderColor = isOver ? "border-green-500" : "border-transparent";

  return (
    <div ref={(node) => { dropRef(node); }} className={`border-2 ${borderColor}`}>
      {children}
    </div>
  );
};

export default DropCell;
