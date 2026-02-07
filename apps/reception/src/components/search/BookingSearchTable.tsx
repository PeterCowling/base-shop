// /src/components/bookingSearch/BookingSearchTable.tsx
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import useActivitiesData from "../../hooks/data/useActivitiesData";
import type { CsvExportRow } from "../../hooks/mutations/useBulkBookingActions";
import useExtendedGuestFinancialData from "../../hooks/orchestrations/useExtendedGuestFinancialData";
import { type Guest } from "../../types/component/bookingSearch";
import { type Activity } from "../../types/hooks/data/activitiesData";
import { type RoomTransaction } from "../../types/hooks/data/financialsRoomData";
import { showToast } from "../../utils/toastUtils";

import BulkActionsToolbar from "./BulkActionsToolbar";
import CopyableBookingRef from "./CopyableBookingRef";
import EditableBalanceCell from "./EditableBalanceCell";
import SmallSpinner from "./SmallSpinner";
import SortableHeader from "./SortableHeader";

export interface BookingSearchTableProps {
  guests: Guest[];
  /** Whether the user has pressed "Search". */
  searchTriggered: boolean;
  /** Callback when bulk cancel completes - parent can refresh data */
  onBulkCancelComplete?: () => void;
}

/* ---------- Inline helpers ---------- */

interface ActivityListProps {
  activities: Activity[];
}
const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  const sorted = useMemo(
    () =>
      [...activities].sort((a, b) =>
        (a.timestamp ?? "").localeCompare(b.timestamp ?? "")
      ),
    [activities]
  );

  if (activities.length === 0)
    return <p className="italic text-gray-600 dark:text-darkAccentGreen">No activities.</p>;

  return (
    <ul className="space-y-1 text-sm leading-relaxed">
      {sorted.map((act) => (
        <li
          key={`${act.timestamp ?? "no-time"}-${act.code}-${act.who ?? ""}`}
          className="flex gap-1"
        >
          <span className="font-mono text-[11px] text-gray-700 dark:text-darkAccentGreen">
            {act.timestamp?.slice(0, 19) ?? ""}
          </span>
          <span className="font-medium">code {act.code}</span>
          {act.who && <span className="text-gray-600 dark:text-darkAccentGreen">— {act.who}</span>}
        </li>
      ))}
    </ul>
  );
};

interface TransactionListProps {
  transactions: RoomTransaction[];
}
const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const sorted = useMemo(
    () =>
      [...transactions].sort((a, b) =>
        (a.timestamp ?? "").localeCompare(b.timestamp ?? "")
      ),
    [transactions]
  );

  if (transactions.length === 0)
    return <p className="italic text-gray-600 dark:text-darkAccentGreen">No transactions.</p>;

  return (
    <ul className="space-y-1 text-sm leading-relaxed">
      {sorted.map((tx) => (
        <li key={`${tx.timestamp}-${tx.type}-${tx.amount}`} className="flex gap-1">
          <span className="font-mono text-[11px] text-gray-700 dark:text-darkAccentGreen">
            {tx.timestamp.slice(0, 19)}
          </span>
          <span className="font-medium">{tx.type}</span>
          <span>€{tx.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
};

/* ---------- Main table ---------- */

const BookingSearchTable: React.FC<BookingSearchTableProps> = ({
  guests,
  searchTriggered,
  onBulkCancelComplete,
}) => {
  /* Fetch merged financial data */
  const { extendedGuests, loading, error } =
    useExtendedGuestFinancialData(guests);

  /* Fetch activities for expand-rows */
  const { activities } = useActivitiesData();
  const activitiesMap = useMemo<Record<string, Activity[]>>(() => {
    if (!activities) return {};
    return Object.fromEntries(
      Object.entries(activities).map(([occId, actObj]) => [
        occId,
        Object.values(actObj),
      ])
    );
  }, [activities]);

  /* Row expansion state */
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = useCallback(
    (guestId: string) =>
      setExpandedRows((prev) => ({ ...prev, [guestId]: !prev[guestId] })),
    []
  );

  /* Row selection state for bulk actions */
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Clear selection when guests change
  useEffect(() => {
    setSelectedRows(new Set());
  }, [guests]);

  const toggleRowSelection = useCallback((bookingRef: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(bookingRef)) {
        next.delete(bookingRef);
      } else {
        next.add(bookingRef);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedRows.size === extendedGuests.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(extendedGuests.map((g) => g.bookingRef)));
    }
  }, [extendedGuests, selectedRows.size]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  // Get selected booking refs and data for bulk actions
  const selectedBookingRefs = useMemo(
    () => Array.from(selectedRows),
    [selectedRows]
  );

  const selectedData: CsvExportRow[] = useMemo(
    () =>
      extendedGuests
        .filter((g) => selectedRows.has(g.bookingRef))
        .map((g) => ({
          bookingRef: g.bookingRef,
          firstName: g.firstName,
          lastName: g.lastName,
          activityLevel: g.activityLevel,
          refundStatus: g.refundStatus,
          balance: g.balance,
          totalPaid: g.totalPaid,
          totalAdjust: g.totalAdjust,
        })),
    [extendedGuests, selectedRows]
  );

  const allSelected =
    extendedGuests.length > 0 && selectedRows.size === extendedGuests.length;

  /* Sorting */
  const [sortBy, setSortBy] = useState("name");
  const [ascending, setAscending] = useState(true);
  const handleHeaderClick = useCallback(
    (field: string) => {
      setAscending((prev) => (sortBy === field ? !prev : true));
      setSortBy(field);
    },
    [sortBy]
  );

  const sortedGuests = useMemo(() => {
    const list = [...extendedGuests];
    list.sort((a, b) => {
      const dir = ascending ? 1 : -1;
      switch (sortBy) {
        case "name":
          return (
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            ) * dir
          );
        case "bookingRef":
          return a.bookingRef.localeCompare(b.bookingRef) * dir;
        case "activityLevel":
          return a.activityLevel.localeCompare(b.activityLevel) * dir;
        case "refundStatus":
          return a.refundStatus.localeCompare(b.refundStatus) * dir;
        case "toPay":
          return (a.balance - b.balance) * dir;
        case "paid":
          return (a.totalPaid - b.totalPaid) * dir;
        case "adjust":
          return (a.totalAdjust - b.totalAdjust) * dir;
        default:
          return 0;
      }
    });
    return list;
  }, [extendedGuests, sortBy, ascending]);

  /* Toast any fetch error */
  useEffect(() => {
    if (error) showToast(String(error), "error");
  }, [error]);

  /* Guard render states */
  if (!searchTriggered) return null;
  if (loading)
    return (
      <div className="rounded-md border border-gray-400 bg-white p-6 text-center shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        <SmallSpinner />
      </div>
    );
  if (error) return null;
  if (!extendedGuests.length)
    return (
      <p className="rounded-md border border-gray-400 bg-white p-6 text-center italic text-gray-600 shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        No matching results.
      </p>
    );

  return (
    <>
      {/* Bulk actions toolbar - shows when rows selected */}
      <BulkActionsToolbar
        selectedCount={selectedRows.size}
        selectedBookingRefs={selectedBookingRefs}
        selectedData={selectedData}
        onClearSelection={clearSelection}
        onCancelComplete={onBulkCancelComplete}
      />

      <div className="w-full overflow-x-auto rounded-md border border-gray-400 bg-white shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[1] bg-gray-50/90 backdrop-blur dark:bg-darkSurface">
            <tr>
              {/* Select all checkbox */}
              <th scope="col" className="w-10 border-b border-gray-400 px-3 py-2 dark:border-darkSurface">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:focus:ring-blue-500 dark:border-gray-600 dark:bg-darkSurface"
                  aria-label="Select all rows"
                />
              </th>
              <th scope="col" className="w-10 border-b border-gray-400 dark:border-darkSurface" />
              <SortableHeader
              label="Name"
              field="name"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
            />
            <SortableHeader
              label="Booking Ref"
              field="bookingRef"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
            />
            <SortableHeader
              label="Activity Level"
              field="activityLevel"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
            />
            <SortableHeader
              label="Refundable?"
              field="refundStatus"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
            />
            <SortableHeader
              label="To Pay"
              field="toPay"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
              className="text-end"
            />
            <SortableHeader
              label="Paid"
              field="paid"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
              className="text-end"
            />
            <SortableHeader
              label="Adjust"
              field="adjust"
              currentField={sortBy}
              ascending={ascending}
              onSort={handleHeaderClick}
              className="text-end"
            />
          </tr>
        </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-darkSurface">
            {sortedGuests.map((guest) => {
              const isExpanded = !!expandedRows[guest.guestId];
              const isSelected = selectedRows.has(guest.bookingRef);
              const activitiesForGuest =
                activitiesMap[guest.guestId] ?? /* fallback */ [];

              return (
                <Fragment key={guest._key ?? guest.guestId}>
                  {/* -------  Main row  ------- */}
                  <tr className={`transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "odd:bg-white even:bg-gray-50 hover:bg-primary-50 dark:odd:bg-darkSurface dark:even:bg-darkSurface"}`}>
                    {/* Row selection checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(guest.bookingRef)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus-visible:focus:ring-blue-500 dark:border-gray-600 dark:bg-darkSurface"
                        aria-label={`Select booking ${guest.bookingRef}`}
                      />
                    </td>
                    {/* Expand / collapse cell */}
                    <td className="px-3 py-2 text-center">
                      <button
                      type="button"
                      onClick={() => toggleRow(guest.guestId)}
                      className="rounded-full p-0.5 hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isExpanded ? "Collapse" : "Expand"} row
                      </span>
                    </button>
                  </td>

                  {/* Name */}
                  <td className="px-3 py-2">
                    {guest.firstName} {guest.lastName}
                  </td>

                  {/* Booking ref */}
                  <td className="px-3 py-2">
                    <CopyableBookingRef text={guest.bookingRef} />
                  </td>

                  {/* Activity level */}
                  <td className="px-3 py-2">{guest.activityLevel}</td>

                  {/* Refund status badge */}
                  <td className="px-3 py-2">
                    {guest.refundStatus === "Non-Refundable" ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Non‑Refundable
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Refundable
                      </span>
                    )}
                  </td>

                  {/* Editable balance */}
                  <EditableBalanceCell
                    bookingRef={guest.bookingRef}
                    initialValue={guest.balance}
                  />

                  {/* Paid */}
                  <td className="px-3 py-2 text-end">
                    €{guest.totalPaid.toFixed(2)}
                  </td>

                  {/* Adjust */}
                  <td className="px-3 py-2 text-end">
                    €{guest.totalAdjust.toFixed(2)}
                  </td>
                </tr>

                  {/* -------  Expanded details  ------- */}
                  {isExpanded && (
                    <tr className="bg-gray-50 even:bg-white dark:bg-darkSurface dark:even:bg-darkSurface">
                      <td colSpan={9} className="px-4 py-4">
                      <div className="flex flex-col gap-4 md:flex-row">
                        <section className="md:w-1/2">
                          <h4 className="mb-1 flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-darkAccentGreen">
                            Activities
                            {activitiesForGuest.length === 0 && (
                              <XMarkIcon
                                className="h-4 w-4 text-gray-600 dark:text-darkAccentGreen"
                                aria-hidden="true"
                              />
                            )}
                          </h4>
                          <ActivityList activities={activitiesForGuest} />
                        </section>

                        <section className="md:w-1/2">
                          <h4 className="mb-1 flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-darkAccentGreen">
                            Transactions
                            {guest.transactions.length === 0 && (
                              <XMarkIcon
                                className="h-4 w-4 text-gray-600 dark:text-darkAccentGreen"
                                aria-hidden="true"
                              />
                            )}
                          </h4>
                          <TransactionList transactions={guest.transactions} />
                        </section>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default React.memo(BookingSearchTable);
