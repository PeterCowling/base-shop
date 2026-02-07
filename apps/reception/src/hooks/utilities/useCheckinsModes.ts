import { useCallback, useState } from "react";

import type { CheckInRow } from "../../types/component/CheckinRow";

export default function useCheckinsModes() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [isAddGuestMode, setIsAddGuestMode] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CheckInRow | null>(
    null
  );
  const [bookingToDelete, setBookingToDelete] = useState<CheckInRow | null>(
    null
  );

  const toggleAddGuestMode = useCallback(() => {
    setIsAddGuestMode((p) => !p);
    setIsEditMode(false);
    setIsDeleteMode(false);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((p) => !p);
    setIsDeleteMode(false);
    setIsAddGuestMode(false);
  }, []);

  const toggleDeleteMode = useCallback(() => {
    setIsDeleteMode((p) => !p);
    setIsEditMode(false);
    setIsAddGuestMode(false);
  }, []);

  const openArchiveModal = useCallback(() => {
    setShowArchiveModal(true);
    setIsEditMode(false);
    setIsDeleteMode(false);
    setIsAddGuestMode(false);
  }, []);

  return {
    isEditMode,
    isDeleteMode,
    isAddGuestMode,
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
