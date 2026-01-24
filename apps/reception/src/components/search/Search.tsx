// src/components/bookingSearch/Search.tsx

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import useBookingSearchClient from "../../hooks/client/useBookingSearchClient";
import { type BookingSearchRow, type Guest } from "../../types/component/bookingSearch";
import { showToast } from "../../utils/toastUtils";

import BookingSearchTable from "./BookingSearchTable";
import FilterBar from "./FilterBar";
import FinancialTransactionAuditSearch from "./FinancialTransactionAuditSearch";
import FinancialTransactionSearch from "./FinancialTransactionSearch";
import SmallSpinner from "./SmallSpinner";

/**
 * Maps each numeric activity code to a descriptive text label.
 */
const activityCodes: Record<number, string> = {
  1: "Booking created",
  2: "First reminder",
  3: "Second reminder",
  4: "Auto-cancel no T&C",
  5: "Failed room payment (1)",
  6: "Failed room payment (2)",
  7: "Auto-cancel no payment",
  8: "Room payment made",
  9: "City tax payment",
  10: "Keycard deposit made",
  11: "Document details taken",
  12: "Check-in complete",
  13: "Keycard refund made",
  14: "Checkout complete",
  15: "Bag drop T&C",
  16: "Bags picked up",
  17: "Room upgrade",
  18: "Room move",
  19: "Arrival data change",
  20: "Room extension",
  21: "Agreed to non-refundable T&C",
  22: "System generated cancellation",
  23: "Bags dropped",
};

/**
 * Determines the descriptive text for the highest-priority activity code.
 *
 * Priority rules:
 *  - First check codes [4, 7, 22]. If any of these are found, display it immediately.
 *  - If none of those occur, pick the highest-priority code from:
 *    [1, 2, 3, 21, 5, 6, 8, 23, 9, 10, 11, 12, 13, 14, 15, 16]
 *    (treating the rightmost as highest priority).
 *  - Ignore codes [17, 18, 19, 20].
 *  - If no known codes are found, show "No Activity".
 */
function getActivityLevel(activities: BookingSearchRow["activities"]): string {
  if (activities.length === 0) {
    return "No Activity";
  }

  const codes = activities.map((act) => act.code);

  // Top-tier endings: if any of these exist, display that and ignore the rest
  const definitiveEndings = [4, 7, 22];
  for (const ending of definitiveEndings) {
    if (codes.includes(ending)) {
      return activityCodes[ending];
    }
  }

  // Next tier (rightmost in this array is highest priority)
  const orderedCodes = [
    1, 2, 3, 21, 5, 6, 8, 23, 9, 10, 11, 12, 13, 14, 15, 16,
  ];
  for (let i = orderedCodes.length - 1; i >= 0; i--) {
    if (codes.includes(orderedCodes[i])) {
      return activityCodes[orderedCodes[i]];
    }
  }

  // Ignore 17, 18, 19, 20 for display

  // Default if nothing else found
  return "No Activity";
}

function Search(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    "bookings" | "transactions" | "audits"
  >("bookings");
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    bookingRef: "",
    status: "",
    nonRefundable: "",
    date: "",
    roomNumber: "",
  });

  // Whether the user has pressed "Search"
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Fetch & filter only after "Search" is triggered
  const { data, loading, error } = useBookingSearchClient(
    activeTab === "bookings" && searchTriggered
      ? {
          firstName: filters.firstName,
          lastName: filters.lastName,
          bookingRef: filters.bookingRef,
          status: filters.status,
          nonRefundable: filters.nonRefundable,
          date: filters.date,
          roomNumber: filters.roomNumber,
        }
      : { skip: true }
  );

  const [guests, setGuests] = useState<Guest[]>([]);
  const firstRender = useRef(true);

  /**
   * Converts the hook's BookingSearchRow data into a simpler array of Guest objects
   * for table display.
   */
  const transformDataToGuests = useCallback(
    (rows: BookingSearchRow[]): Guest[] => {
      return rows.map((row) => {
        const activityLevel = getActivityLevel(row.activities);

        return {
          _key: `${row.bookingRef}-${row.occupantId}`,
          bookingRef: row.bookingRef,
          guestId: row.occupantId,
          firstName: row.firstName,
          lastName: row.lastName,
          activityLevel,
          refundStatus: row.nonRefundable ? "Non-Refundable" : "Refundable",
        };
      });
    },
    []
  );

  // Recompute guests whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      setGuests(transformDataToGuests(data));
    } else {
      setGuests([]);
    }
  }, [data, transformDataToGuests]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Automatically trigger a search when filters change (debounced)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setSearchTriggered(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const handleSearchClick = useCallback(() => {
    setSearchTriggered(true);
  }, []);

  const setBookingsTab = useCallback(() => {
    setActiveTab("bookings");
  }, []);

  const setTransactionsTab = useCallback(() => {
    setActiveTab("transactions");
  }, []);

  const setAuditsTab = useCallback(() => {
    setActiveTab("audits");
  }, []);

  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : String(error);
  }, [error]);

  useEffect(() => {
    if (errorMessage) {
      showToast(errorMessage, "error");
    }
  }, [errorMessage]);

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={setBookingsTab}
          className={`px-4 py-1 rounded ${
            activeTab === "bookings" ? "bg-blue-600 text-white" : "bg-gray-200"
          } dark:bg-darkSurface dark:text-darkAccentGreen`}
        >
          Bookings
        </button>
        <button
          onClick={setTransactionsTab}
          className={`px-4 py-1 rounded ${
            activeTab === "transactions"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          } dark:bg-darkSurface dark:text-darkAccentGreen`}
        >
          Transactions
        </button>
        <button
          onClick={setAuditsTab}
          className={`px-4 py-1 rounded ${
            activeTab === "audits" ? "bg-blue-600 text-white" : "bg-gray-200"
          } dark:bg-darkSurface dark:text-darkAccentGreen`}
        >
          Audits
        </button>
      </div>

      {activeTab === "bookings" && (
        <>
          <h2 className="text-xl font-semibold mb-4 dark:text-darkAccentGreen">
            Search Bookings
          </h2>

          <FilterBar
            firstName={filters.firstName}
            lastName={filters.lastName}
            bookingRef={filters.bookingRef}
            status={filters.status}
            nonRefundable={filters.nonRefundable}
            date={filters.date}
            roomNumber={filters.roomNumber}
            onFilterChange={handleFilterChange}
            onSearch={handleSearchClick}
            activityCodes={activityCodes}
          />

          {loading && (
            <div className="flex justify-center my-4">
              <SmallSpinner />
            </div>
          )}

          <BookingSearchTable
            guests={guests}
            searchTriggered={searchTriggered}
          />
        </>
      )}

      {activeTab === "transactions" && <FinancialTransactionSearch />}
      {activeTab === "audits" && <FinancialTransactionAuditSearch />}
    </>
  );
}

export default memo(Search);
export { getActivityLevel };
