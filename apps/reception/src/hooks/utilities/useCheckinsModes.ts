import { useCallback, useState } from "react";

import type { CheckInRow } from "../../types/component/CheckinRow";

export type CheckinMode = "idle" | "edit" | "delete" | "addGuest";

export default function useCheckinsModes() {
  const [checkinMode, setCheckinMode] = useState<CheckinMode>("idle");
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CheckInRow | null>(
    null
  );
  const [bookingToDelete, setBookingToDelete] = useState<CheckInRow | null>(
    null
  );

  const toggleAddGuestMode = useCallback(() => {
    setCheckinMode((prev) => (prev === "addGuest" ? "idle" : "addGuest"));
  }, []);

  const toggleEditMode = useCallback(() => {
    setCheckinMode((prev) => (prev === "edit" ? "idle" : "edit"));
  }, []);

  const toggleDeleteMode = useCallback(() => {
    setCheckinMode((prev) => (prev === "delete" ? "idle" : "delete"));
  }, []);

  const openArchiveModal = useCallback(() => {
    setShowArchiveModal(true);
    setCheckinMode("idle");
  }, []);

  return {
    checkinMode,
    showArchiveModal,
    selectedBooking,
    bookingToDelete,
    setSelectedBooking,
    setBookingToDelete,
    toggleAddGuestMode,
    toggleEditMode,
    toggleDeleteMode,
    openArchiveModal,
    closeArchiveModal: () => setShowArchiveModal(false),
  };
}
