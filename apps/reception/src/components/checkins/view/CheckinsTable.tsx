import React from "react";
import { AlertTriangle, Info, UserPlus } from "lucide-react";

import { Input } from "@acme/design-system";
import { Button, Table, TableBody, TableCell, TableRow } from "@acme/design-system/atoms";

import type { CheckinMode } from "../../../hooks/utilities/useCheckinsModes";
import { type CheckInRow } from "../../../types/component/CheckinRow";
import type { SingleRoomStatus } from "../../../types/hooks/data/roomStatusData";
import DateSelector from "../../common/DateSelector";
import { FilterToolbar } from "../../common/FilterToolbar";
import { OperationalTableScreen } from "../../common/OperationalTableScreen";
import ReceptionSkeleton from "../../common/ReceptionSkeleton";
import { TableCard } from "../../common/TableCard";
import BookingRow from "../BookingRow";
import ArchiveConfirmationModal from "../header/ArchiveConfirmationModal";
import BookingModal from "../header/BookingModal";
import CheckinsHeader from "../header/CheckinsHeader";
import DeleteConfirmationModal from "../header/DeleteConfirmationModal";
import TableHeader from "../TableHeader";

interface Props {
  selectedDate: string;
  onDateChange: (d: string) => void;
  roomsReady: boolean;
  setRoomsReady: (v: boolean) => void;
  loading: boolean;
  error: unknown;
  finalSortedData: CheckInRow[];
  guestsByBooking: Record<string, CheckInRow[]>;
  eligibleCount: number;
  checkinMode: CheckinMode;
  onRowClick: (booking: CheckInRow) => void;
  onNewBookingClick: React.MouseEventHandler<HTMLButtonElement>;
  onEditClick: React.MouseEventHandler<HTMLButtonElement>;
  onDeleteClick: React.MouseEventHandler<HTMLButtonElement>;
  onArchiveClick: React.MouseEventHandler<HTMLButtonElement>;
  selectedBooking: CheckInRow | null;
  bookingToDelete: CheckInRow | null;
  showArchiveModal: boolean;
  closeSelectedBooking: () => void;
  closeBookingToDelete: () => void;
  closeArchiveModal: () => void;
  /** Callback after archiving completes */
  onArchiveComplete: () => void;
  /** Show/hide cancelled bookings toggle */
  showCancelled: boolean;
  onToggleCancelled: () => void;
  /** Booking statuses map (bookingRef -> status) */
  bookingStatuses: Record<string, string | undefined>;
  /** Room status map (roomNumber -> SingleRoomStatus), or null while loading */
  roomStatusMap: Record<string, SingleRoomStatus> | null;
}

/**
 * CheckinsTableView — canonical OperationalTableScreen reference implementation.
 *
 * Migrated in TASK-04 (reception-theme-styling-cohesion Wave 1) to use:
 * - OperationalTableScreen: single gradient source + standard padding
 * - CheckinsHeader: injected via headerSlot (handles role gating internally)
 * - FilterToolbar: slot-based; DateSelector + controls are caller-injected
 * - TableCard: canonical surface recipe (rounded-xl bg-surface-2 border-strong shadow-xl)
 *
 * Modals are rendered outside TableCard as siblings in OperationalTableScreen
 * to preserve portal/z-index independence.
 */
const CheckinsTableView: React.FC<Props> = ({
  selectedDate,
  onDateChange,
  roomsReady,
  setRoomsReady,
  loading,
  error,
  finalSortedData,
  guestsByBooking,
  eligibleCount,
  checkinMode,
  onRowClick,
  onNewBookingClick,
  onEditClick,
  onDeleteClick,
  onArchiveClick,
  selectedBooking,
  bookingToDelete,
  showArchiveModal,
  closeSelectedBooking,
  closeBookingToDelete,
  closeArchiveModal,
  onArchiveComplete,
  showCancelled,
  onToggleCancelled,
  bookingStatuses,
  roomStatusMap,
}) => (
  <OperationalTableScreen
    title="Check-ins"
    headerSlot={
      <CheckinsHeader
        onNewBookingClick={onNewBookingClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onArchiveClick={onArchiveClick}
        eligibleCount={eligibleCount}
      />
    }
  >
    <TableCard>
      {/* Mode banners */}
      {checkinMode === "edit" && (
        <div className="bg-info-light/80 rounded-lg px-4 py-2.5 flex items-center gap-2.5 border border-info-main/20">
          <Info className="text-info-main shrink-0" size={16} />
          <span className="text-info-main text-sm font-medium">
            Click a row to edit the booking
          </span>
        </div>
      )}
      {checkinMode === "delete" && (
        <div className="bg-error-main/10 rounded-lg px-4 py-2.5 flex items-center gap-2.5 border border-error-main/20">
          <AlertTriangle className="text-error-main shrink-0" size={16} />
          <span className="text-error-main text-sm font-medium">
            Click a row to delete the booking
          </span>
        </div>
      )}
      {checkinMode === "addGuest" && (
        <div className="bg-success-light/80 rounded-lg px-4 py-2.5 flex items-center gap-2.5 border border-success-main/20">
          <UserPlus className="text-success-main shrink-0" size={16} />
          <span className="text-success-main text-sm font-medium">
            Click a row to add a guest to that booking
          </span>
        </div>
      )}

      {/* Filter controls */}
      <FilterToolbar>
        <div className="space-y-3 w-full">
          <DateSelector
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            accessMode="role-aware-calendar"
            calendarColorVariant="primary"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer select-none group">
              <Input
                compatibilityMode="no-wrapper"
                type="checkbox"
                checked={showCancelled}
                onChange={onToggleCancelled}
                className="w-4 h-4 cursor-pointer accent-primary-main"
              />
              <span className="group-hover:text-foreground transition-colors">Show cancelled</span>
            </label>
            {roomsReady ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-main/10 border border-success-main/20 px-3 py-1.5 text-sm font-semibold text-success-main">
                <span className="h-1.5 w-1.5 rounded-full bg-success-main" />
                Rooms Ready
              </span>
            ) : (
              <Button
                color="primary"
                tone="solid"
                type="button"
                onClick={() => setRoomsReady(true)}
                className="rounded-lg bg-primary-main px-4 py-2 text-sm font-semibold text-primary-fg transition-all duration-150 hover:brightness-110 active:scale-95"
              >
                Rooms Ready
              </Button>
            )}
          </div>
        </div>
      </FilterToolbar>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border-strong">
        <Table className="w-full table-auto text-sm">
          <TableHeader />
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={12} className="p-0">
                  <ReceptionSkeleton rows={5} />
                </TableCell>
              </TableRow>
            )}
            {!loading && error != null && (
              <TableRow>
                <TableCell colSpan={12} className="p-4 text-center text-error-main">
                  Error: {String(error)}
                </TableCell>
              </TableRow>
            )}
            {!loading && error == null && finalSortedData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="p-8 text-center italic text-muted-foreground"
                >
                  No check-ins found for this date.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              error == null &&
              finalSortedData.length > 0 &&
              finalSortedData.map((guestRow) => (
                <BookingRow
                  key={`${guestRow.bookingRef}_${guestRow.occupantId}`}
                  booking={guestRow}
                  selectedDate={selectedDate}
                  allGuests={guestsByBooking[guestRow.bookingRef] || []}
                  onRowClick={
                    checkinMode !== "idle"
                      ? onRowClick
                      : undefined
                  }
                  isCancelled={bookingStatuses[guestRow.bookingRef] === "cancelled"}
                  roomStatusMap={roomStatusMap}
                />
              ))}
          </TableBody>
        </Table>
      </div>
    </TableCard>

    {/* Modals — outside TableCard as siblings; preserves portal/z-index independence */}
    {selectedBooking && (
      <BookingModal booking={selectedBooking} onClose={closeSelectedBooking} />
    )}
    {bookingToDelete && (
      <DeleteConfirmationModal
        booking={bookingToDelete}
        onClose={closeBookingToDelete}
      />
    )}
    {showArchiveModal && (
      <ArchiveConfirmationModal
        onClose={closeArchiveModal}
        onArchiveComplete={onArchiveComplete}
      />
    )}
  </OperationalTableScreen>
);

export default CheckinsTableView;
