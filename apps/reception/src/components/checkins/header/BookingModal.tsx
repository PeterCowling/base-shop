// src/components/checkins/BookingModal.tsx
import React, {
  type ChangeEvent,
  type FC,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { SimpleModal } from "@acme/ui/molecules";

import { useBookingDatesMutator } from "../../../hooks/mutations/useChangeBookingDatesMutator";
import { type CheckInRow } from "../../../types/component/CheckinRow";
import { parseYMD } from "../../../utils/dateUtils";

/**
 * BookingModalProps:
 * - booking: check-in record with occupant and booking info
 * - onClose: closes the modal
 *
 * This modal allows users to edit check-in and check-out dates.
 * When the dates are updated and saved, the database is updated accordingly.
 *
 * New requirement:
 * - If a user changes the check-out date so that the booking is extended,
 *   we require an additional "extension price" input that must be filled before saving.
 * - If the user reverts the check-out date such that it's not an extension anymore,
 *   the price input disappears and is no longer required.
 * - If the booking is extended, an additional transaction will be recorded via Firebase
 *   to account for the charge.
 *
 * How to avoid breaking other code:
 * - Retain the existing modal structure and styling.
 * - Only add the new price input when needed.
 * - Data mutation is handled via the useBookingDatesMutator hook
 *   (we pass the extension price if the booking is extended).
 */
interface BookingModalProps {
  booking: CheckInRow;
  onClose: () => void;
}

const BookingModal: FC<BookingModalProps> = React.memo(
  ({ booking, onClose }) => {
    // Initialize state; default to an empty string if booking.checkOutDate is undefined.
    const [checkIn, setCheckIn] = useState<string>(booking.checkInDate);
    const [checkOut, setCheckOut] = useState<string>(
      booking.checkOutDate ?? ""
    );
    const [extensionPrice, setExtensionPrice] = useState<string>("");
    const [priceError, setPriceError] = useState<string>("");

    const { updateBookingDates, isLoading } = useBookingDatesMutator();

    // Check if the new checkOut date is strictly later than the old one => extended
    const isExtended = useMemo(() => {
      if (!booking.checkOutDate || !checkOut) return false; // no old or new => not extended
      const oldTime = parseYMD(booking.checkOutDate);
      const newTime = parseYMD(checkOut);
      return newTime > oldTime;
    }, [booking.checkOutDate, checkOut]);

    // Clear extension price if the user reverts a date so there's no extension
    useEffect(() => {
      if (!isExtended) {
        setExtensionPrice("");
        setPriceError("");
      }
    }, [isExtended]);

    // Handle changes to the check-in date.
    const handleCheckInChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setCheckIn(e.target.value);
      },
      []
    );

    // Handle changes to the check-out date.
    const handleCheckOutChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setCheckOut(e.target.value);
      },
      []
    );

    // Handle changes to the extension price input.
    const handleExtensionPriceChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        setExtensionPrice(e.target.value);
        setPriceError("");
      },
      []
    );

    // Save the updated dates to the database.
    const handleSave = useCallback(() => {
      // If there's an extension, require a valid price
      if (isExtended) {
        // Basic numeric check
        const val = parseFloat(extensionPrice);
        if (Number.isNaN(val) || val <= 0) {
          setPriceError("Please enter a valid extension charge amount.");
          return;
        }
      }

      // Use booking.occupantId or fallback if not available.
      const occupantId = booking.occupantId || "unknown_occupant";

      // Pass extensionPrice only if it's an actual extension
      updateBookingDates({
        bookingRef: booking.bookingRef,
        occupantId,
        oldCheckIn: booking.checkInDate ?? "",
        oldCheckOut: booking.checkOutDate ?? "",
        newCheckIn: checkIn,
        newCheckOut: checkOut,
        extendedPrice: isExtended ? extensionPrice : "0",
      });

      onClose();
    }, [
      booking.bookingRef,
      booking.checkInDate,
      booking.checkOutDate,
      booking.occupantId,
      checkIn,
      checkOut,
      isExtended,
      extensionPrice,
      updateBookingDates,
      onClose,
    ]);

    return (
      <SimpleModal
        isOpen={true}
        onClose={onClose}
        title="Booking Details"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              className="px-4 py-2 bg-surface-3 text-foreground rounded-lg"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="px-4 py-2 bg-primary-main text-primary-fg rounded-lg"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        }
      >
        {/* Booking Reference */}
        <div className="mb-2">
          <span className="font-semibold">Booking Ref:</span>{" "}
          {booking.bookingRef}
        </div>

        {/* Guest Name */}
        <div className="mb-2">
          <span className="font-semibold">Guest Name:</span>{" "}
          {booking.firstName} {booking.lastName}
        </div>

        {/* Room Booked */}
        <div className="mb-2">
          <span className="font-semibold">Room Booked:</span>{" "}
          {booking.roomBooked}
        </div>

        {/* Room Allocated */}
        <div className="mb-2">
          <span className="font-semibold">Room Allocated:</span>{" "}
          {booking.roomAllocated}
        </div>

        {/* Editable Check-in Date */}
        <div className="mb-2">
          <label htmlFor="check-in-date" className="font-semibold me-2">
            Check-in Date:
          </label>
          <Input compatibilityMode="no-wrapper"
            id="check-in-date"
            type="date"
            className="border rounded-lg px-2 py-1 text-foreground"
            value={checkIn}
            onChange={handleCheckInChange}
          />
        </div>

        {/* Editable Check-out Date */}
        <div className="mb-2">
          <label htmlFor="check-out-date" className="font-semibold me-2">
            Check-out Date:
          </label>
          <Input compatibilityMode="no-wrapper"
            id="check-out-date"
            type="date"
            className="border rounded-lg px-2 py-1 text-foreground"
            value={checkOut}
            onChange={handleCheckOutChange}
          />
        </div>

        {/* Extension Price Input (Only visible if isExtended) */}
        {isExtended && (
          <div className="mb-2">
            <label htmlFor="extension-price" className="font-semibold me-2">
              Extension Charge:
            </label>
            <Input compatibilityMode="no-wrapper"
              id="extension-price"
              type="number"
              step="0.01"
              min="0"
              className="border rounded-lg px-2 py-1 text-foreground"
              value={extensionPrice}
              onChange={handleExtensionPriceChange}
            />
            {priceError && (
              <div className="text-error-main text-sm mt-1">{priceError}</div>
            )}
          </div>
        )}
      </SimpleModal>
    );
  }
);

BookingModal.displayName = "BookingModal";
export default BookingModal;
