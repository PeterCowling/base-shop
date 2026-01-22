// src/components/roomgrid/BookingDraggable.tsx

import { type FC } from "react";
import { useDrag } from "react-dnd";

interface BookingDraggableProps {
  occupantId: string;
  bookingRef: string;
  date: string;
  roomNumber: string;
  firstName?: string;
  lastName?: string;
}

// The "item" structure is what we pass to the drop target
const BookingDraggable: FC<BookingDraggableProps> = ({
  occupantId,
  bookingRef,
  date,
  roomNumber,
  firstName,
  lastName,
}) => {
  // The "type" is a string identifying the drag item category
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "BOOKING",
    item: { occupantId, bookingRef, date, fromRoom: roomNumber },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const opacity = isDragging ? 0.4 : 1;

  return (
    <div
      ref={(node) => { dragRef(node); }}
      style={{ cursor: "move", opacity }}
      className="border border-blue-300 bg-blue-50 p-1 rounded text-xs"
    >
      {/* Display occupant/booking info */}
      {firstName} {lastName} <br />
      (Ref: {bookingRef})
    </div>
  );
};

export default BookingDraggable;
