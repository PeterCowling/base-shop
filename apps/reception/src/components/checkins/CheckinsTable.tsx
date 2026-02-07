// src/components/checkins/CheckinsTable.tsx
import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import useCheckinsTableData from "../../hooks/data/useCheckinsTableData";
import useAddGuestToBookingMutation from "../../hooks/mutations/useAddGuestToBookingMutation";
import useArchiveEligibleCount from "../../hooks/mutations/useArchiveEligibleCount";
import useCheckinsModes from "../../hooks/utilities/useCheckinsModes";
import useSharedDailyToggle from "../../hooks/utilities/useSharedDailyToggle";
import { type CheckInRow } from "../../types/component/CheckinRow";
import { getLocalToday } from "../../utils/dateUtils";
import { getErrorMessage } from "../../utils/errorMessage";
import { sortCheckinsData } from "../../utils/sortCheckins";
import { showToast } from "../../utils/toastUtils";

import CheckinsTableView from "./view/CheckinsTable";

/**
 * Main Checkins Table Controller
 *
 * Displays a table of "checkins" (bookings + occupant data) for the chosen date.
 * Provides new booking creation, editing, and deletion features.
 * Also supports "Add Guest" flow by replicating occupant data from an existing occupant.
 */
const CheckinsTable: React.FC = () => {
  const { user } = useAuth();
  const { addReplicatedGuestToBooking } = useAddGuestToBookingMutation();

  // Pull a date from URL search params; default to today's date.
  const searchParams = useSearchParams();
  const todayStr = getLocalToday();
  const initialSelectedDate = searchParams.get("selectedDate") ?? todayStr;
  const [selectedDate, setSelectedDate] = useState<string>(initialSelectedDate);

  useEffect(() => {
    const dateParam = searchParams.get("selectedDate");
    if (dateParam) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  const lowerName = user?.user_name?.toLowerCase();
  const isPete = lowerName === "pete" || lowerName === "peter";
  const fetchSelectedDate = isPete ? selectedDate : todayStr;
  const { rows, loading, error, validationError } = useCheckinsTableData({
    selectedDate: fetchSelectedDate,
    daysBefore: isPete ? 1 : 0,
    daysAfter: isPete ? 5 : 1,
  });

  useEffect(() => {
    if (validationError) {
      showToast(getErrorMessage(validationError), "warning");
    }
  }, [validationError]);

  /**
   * rows already contains occupants within a pre-defined range.
   */
  const tableData = useMemo<CheckInRow[]>(() => rows, [rows]);

  /**
   * Local filter by selectedDate
   */
  const filteredBySelectedDate = useMemo<CheckInRow[]>(() => {
    return tableData.filter((row) => row.checkInDate === selectedDate);
  }, [tableData, selectedDate]);

  /**
   * Sort after data is loaded or partially loaded
   */
  const finalSortedData = useMemo<CheckInRow[]>(() => {
    return sortCheckinsData(filteredBySelectedDate);
  }, [filteredBySelectedDate]);

  const guestsByBooking = useMemo<Record<string, CheckInRow[]>>(() => {
    const map: Record<string, CheckInRow[]> = {};
    finalSortedData.forEach((row) => {
      if (!map[row.bookingRef]) map[row.bookingRef] = [];
      map[row.bookingRef].push(row);
    });
    return map;
  }, [finalSortedData]);

  const modes = useCheckinsModes();
  const {
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
    closeArchiveModal,
  } = modes;

  const [roomsReady, setRoomsReady] = useSharedDailyToggle("roomsReady");
  const { eligibleCount, refresh: refreshEligibleCount } =
    useArchiveEligibleCount();

  const handleNewBookingClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      event.preventDefault();
      toggleAddGuestMode();
    },
    [toggleAddGuestMode]
  );

  const handleEditClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      e.preventDefault();
      toggleEditMode();
    },
    [toggleEditMode]
  );

  const handleDeleteClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      e.preventDefault();
      toggleDeleteMode();
    },
    [toggleDeleteMode]
  );

  const handleArchiveClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (e) => {
      e.preventDefault();
      openArchiveModal();
    },
    [openArchiveModal]
  );

  const handleRowClickForEdit = useCallback(
    (booking: CheckInRow) => {
      setSelectedBooking(booking);
    },
    [setSelectedBooking]
  );

  const handleRowClickForDelete = useCallback(
    (booking: CheckInRow) => {
      setBookingToDelete(booking);
    },
    [setBookingToDelete]
  );

  /**
   * Handle the row click when in "Add Guest" mode:
   * use the mutator hook to replicate occupant data from the occupant clicked.
   */
  const handleRowClickForAddGuest = useCallback(
    async (booking: CheckInRow) => {
      try {
        await addReplicatedGuestToBooking(
          booking.bookingRef,
          booking.occupantId,
          {
            firstName: "Auto",
            lastName: "Created",
          }
        );
        showToast(
          `New guest added successfully to booking: ${booking.bookingRef}.`,
          "success"
        );
      } catch (err: unknown) {
        console.error("Error adding guest to booking:", err);
        showToast("Failed to add a guest to this booking. Please try again.", "error");
      } finally {
        toggleAddGuestMode();
      }
    },
    [addReplicatedGuestToBooking, toggleAddGuestMode]
  );

  /**
   * Single entry point for row click logic, depending on which mode is active.
   */
  const handleRowClick = useCallback(
    (booking: CheckInRow) => {
      if (isEditMode) {
        handleRowClickForEdit(booking);
      } else if (isDeleteMode) {
        handleRowClickForDelete(booking);
      } else if (isAddGuestMode) {
        handleRowClickForAddGuest(booking);
      }
    },
    [
      isEditMode,
      isDeleteMode,
      isAddGuestMode,
      handleRowClickForEdit,
      handleRowClickForDelete,
      handleRowClickForAddGuest,
    ]
  );

  // If user is not authorized, show a simple message
  if (!user) {
    return (
      <p className="p-5 text-error-main">Not authorized. Please log in.</p>
    );
  }

  return (
    <CheckinsTableView
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      username={user.user_name}
      roomsReady={roomsReady}
      setRoomsReady={setRoomsReady}
      loading={loading}
      error={error && getErrorMessage(error)}
      finalSortedData={finalSortedData}
      guestsByBooking={guestsByBooking}
      eligibleCount={eligibleCount}
      isEditMode={isEditMode}
      isDeleteMode={isDeleteMode}
      isAddGuestMode={isAddGuestMode}
      onRowClick={handleRowClick}
      onNewBookingClick={handleNewBookingClick}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteClick}
      onArchiveClick={handleArchiveClick}
      selectedBooking={selectedBooking}
      bookingToDelete={bookingToDelete}
      showArchiveModal={showArchiveModal}
      closeSelectedBooking={() => setSelectedBooking(null)}
      closeBookingToDelete={() => setBookingToDelete(null)}
      closeArchiveModal={closeArchiveModal}
      onArchiveComplete={refreshEligibleCount}
    />
  );
};

export default memo(CheckinsTable);
