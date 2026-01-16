/**
 * BulkActionsToolbar.tsx
 *
 * Toolbar that appears when rows are selected in the booking search table.
 * Provides bulk actions: Cancel, Export CSV.
 */

import { memo, useCallback, useState } from "react";
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import ConfirmCancelModal from "./ConfirmCancelModal";
import useBulkBookingActions, {
  CsvExportRow,
} from "../../hooks/mutations/useBulkBookingActions";
import { hasAnyRole } from "../../lib/roles";
import { Permissions } from "../../lib/roles";
import { useAuth } from "../../context/AuthContext";

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedBookingRefs: string[];
  selectedData: CsvExportRow[];
  onClearSelection: () => void;
  onCancelComplete?: () => void;
}

function BulkActionsToolbar({
  selectedCount,
  selectedBookingRefs,
  selectedData,
  onClearSelection,
  onCancelComplete,
}: BulkActionsToolbarProps) {
  const { user } = useAuth();
  const { cancelBookings, exportToCsv, loading } = useBulkBookingActions();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const canBulkAction = hasAnyRole(user, Permissions.BULK_ACTIONS);

  const handleExportCsv = useCallback(() => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCsv(selectedData, `bookings-export-${timestamp}.csv`);
  }, [exportToCsv, selectedData]);

  const handleCancelClick = useCallback(() => {
    setShowCancelModal(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    await cancelBookings(selectedBookingRefs);
    setShowCancelModal(false);
    onClearSelection();
    onCancelComplete?.();
  }, [cancelBookings, selectedBookingRefs, onClearSelection, onCancelComplete]);

  const handleCancelModalClose = useCallback(() => {
    setShowCancelModal(false);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="sticky top-0 z-10 mb-4 flex items-center justify-between gap-4 rounded-lg bg-blue-50 px-4 py-3 shadow-sm dark:bg-blue-900/30">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {selectedCount} booking{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-md px-2 py-1 text-sm text-blue-600 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-800/50"
          >
            <XMarkIcon className="h-4 w-4" />
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV - always available */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex min-h-9 items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-darkSurface dark:text-darkAccentGreen dark:ring-gray-600 dark:hover:bg-gray-700"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>

          {/* Cancel - requires privileged access */}
          {canBulkAction && (
            <button
              type="button"
              onClick={handleCancelClick}
              disabled={loading}
              className="inline-flex min-h-9 items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
            >
              <TrashIcon className="h-4 w-4" />
              {loading ? "Cancelling..." : "Cancel Selected"}
            </button>
          )}
        </div>
      </div>

      <ConfirmCancelModal
        isOpen={showCancelModal}
        bookingCount={selectedCount}
        bookingRefs={selectedBookingRefs}
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelModalClose}
      />
    </>
  );
}

export default memo(BulkActionsToolbar);
