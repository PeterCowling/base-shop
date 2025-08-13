"use client";

import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/primitives/select";
import { Button } from "../../atoms/primitives/button";

interface Props {
  /** Identifier or name for the bookable resource */
  resource?: string;
  /** Start date in ISO format (YYYY-MM-DD) */
  startDate?: string;
  /** End date in ISO format (YYYY-MM-DD) */
  endDate?: string;
  /** Slot duration in minutes */
  slotDuration?: number;
}

/**
 * Simple booking calendar block. Displays available time slots within the
 * provided date range and allows the user to reserve a slot. Bookings are
 * stored locally in component state.
 */
export default function BookingCalendar({
  resource = "Resource",
  startDate,
  endDate,
  slotDuration = 60,
}: Props) {
  const start = useMemo(() => (startDate ? new Date(startDate) : new Date()), [
    startDate,
  ]);
  const end = useMemo(() => (endDate ? new Date(endDate) : start), [
    endDate,
    start,
  ]);

  const dates = useMemo(() => {
    const list: string[] = [];
    const d = new Date(start);
    while (d <= end) {
      list.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return list;
  }, [start, end]);

  const [selectedDate, setSelectedDate] = useState<string>(dates[0]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    const result: string[] = [];
    const current = new Date(`${selectedDate}T09:00:00`);
    const dayEnd = new Date(`${selectedDate}T17:00:00`);
    while (current < dayEnd) {
      const iso = current.toISOString();
      if (!bookedSlots.includes(iso)) result.push(iso);
      current.setMinutes(current.getMinutes() + slotDuration);
    }
    return result;
  }, [selectedDate, slotDuration, bookedSlots]);

  const handleBook = (iso: string) => {
    setBookedSlots((prev) => [...prev, iso]);
    setConfirmation(iso);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{resource}</h3>
      {dates.length > 1 && (
        <Select value={selectedDate} onValueChange={setSelectedDate}>
          <SelectTrigger>
            <SelectValue placeholder="Select date" />
          </SelectTrigger>
          <SelectContent>
            {dates.map((d) => (
              <SelectItem key={d} value={d}>
                {new Date(d).toDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => (
          <Button
            key={slot}
            variant="outline"
            className="w-full"
            onClick={() => handleBook(slot)}
          >
            {new Date(slot).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Button>
        ))}
        {slots.length === 0 && (
          <p className="col-span-2 text-center text-sm">No slots available</p>
        )}
      </div>
      {confirmation && (
        <p className="text-sm">
          Booked {resource} on {new Date(confirmation).toLocaleString()}
        </p>
      )}
    </div>
  );
}
