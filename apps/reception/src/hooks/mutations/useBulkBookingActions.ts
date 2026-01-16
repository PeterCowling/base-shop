/**
 * useBulkBookingActions.ts
 *
 * Hook for performing bulk operations on multiple bookings at once.
 * Supports cancellation and CSV export.
 */

import { useCallback, useState } from "react";
import useDeleteBooking from "./useDeleteBooking";
import { showToast } from "../../utils/toastUtils";

export interface BulkActionResult {
  success: string[];
  failed: string[];
}

interface UseBulkBookingActionsReturn {
  cancelBookings: (bookingRefs: string[]) => Promise<BulkActionResult>;
  exportToCsv: (data: CsvExportRow[], filename?: string) => void;
  loading: boolean;
  error: unknown;
}

export interface CsvExportRow {
  bookingRef: string;
  firstName: string;
  lastName: string;
  activityLevel: string;
  refundStatus: string;
  balance: number;
  totalPaid: number;
  totalAdjust: number;
}

/**
 * Escapes a CSV field value, handling quotes and commas.
 */
function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Converts an array of objects to CSV format.
 */
function convertToCsv(rows: CsvExportRow[]): string {
  const headers = [
    "Booking Ref",
    "First Name",
    "Last Name",
    "Activity Level",
    "Refund Status",
    "Balance",
    "Total Paid",
    "Total Adjust",
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) =>
      [
        escapeCsvField(row.bookingRef),
        escapeCsvField(row.firstName),
        escapeCsvField(row.lastName),
        escapeCsvField(row.activityLevel),
        escapeCsvField(row.refundStatus),
        escapeCsvField(row.balance.toFixed(2)),
        escapeCsvField(row.totalPaid.toFixed(2)),
        escapeCsvField(row.totalAdjust.toFixed(2)),
      ].join(",")
    ),
  ];

  return csvRows.join("\n");
}

/**
 * Triggers a browser download of a CSV file.
 */
function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function useBulkBookingActions(): UseBulkBookingActionsReturn {
  const { deleteBooking } = useDeleteBooking();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Cancels multiple bookings in sequence.
   * Returns lists of successful and failed booking refs.
   */
  const cancelBookings = useCallback(
    async (bookingRefs: string[]): Promise<BulkActionResult> => {
      setLoading(true);
      setError(null);
      const success: string[] = [];
      const failed: string[] = [];

      for (const bookingRef of bookingRefs) {
        try {
          await deleteBooking(bookingRef);
          success.push(bookingRef);
        } catch (err) {
          failed.push(bookingRef);
          console.error(`Failed to cancel booking ${bookingRef}:`, err);
        }
      }

      setLoading(false);

      if (failed.length > 0) {
        setError(`Failed to cancel ${failed.length} booking(s)`);
        showToast(
          `Cancelled ${success.length} booking(s), ${failed.length} failed`,
          "warning"
        );
      } else {
        showToast(`Successfully cancelled ${success.length} booking(s)`, "success");
      }

      return { success, failed };
    },
    [deleteBooking]
  );

  /**
   * Exports the provided data to a CSV file and triggers download.
   */
  const exportToCsv = useCallback(
    (data: CsvExportRow[], filename = "bookings-export.csv"): void => {
      if (data.length === 0) {
        showToast("No data to export", "warning");
        return;
      }

      const csv = convertToCsv(data);
      downloadCsv(csv, filename);
      showToast(`Exported ${data.length} booking(s) to CSV`, "success");
    },
    []
  );

  return {
    cancelBookings,
    exportToCsv,
    loading,
    error,
  };
}
