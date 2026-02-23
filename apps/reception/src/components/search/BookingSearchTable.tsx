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

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";
import {
  ReceptionTable as Table,
  ReceptionTableBody as TableBody,
  ReceptionTableCell as TableCell,
  ReceptionTableHead as TableHead,
  ReceptionTableHeader as TableHeader,
  ReceptionTableRow as TableRow,
} from "@acme/ui/operations";

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
    return <p className="italic text-muted-foreground dark:text-darkAccentGreen">No activities.</p>;

  return (
    <ul className="space-y-1 text-sm leading-relaxed">
      {sorted.map((act) => (
        <li
          key={`${act.timestamp ?? "no-time"}-${act.code}-${act.who ?? ""}`}
          className="flex gap-1"
        >
          <span className="font-mono text-11px text-foreground dark:text-darkAccentGreen">
            {act.timestamp?.slice(0, 19) ?? ""}
          </span>
          <span className="font-medium">code {act.code}</span>
          {act.who && <span className="text-muted-foreground dark:text-darkAccentGreen">— {act.who}</span>}
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
    return <p className="italic text-muted-foreground dark:text-darkAccentGreen">No transactions.</p>;

  return (
    <ul className="space-y-1 text-sm leading-relaxed">
      {sorted.map((tx) => (
        <li key={`${tx.timestamp}-${tx.type}-${tx.amount}`} className="flex gap-1">
          <span className="font-mono text-11px text-foreground dark:text-darkAccentGreen">
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
      <div className="rounded-md border border-border-2 bg-surface p-6 text-center shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        <SmallSpinner />
      </div>
    );
  if (error) return null;
  if (!extendedGuests.length)
    return (
      <p className="rounded-md border border-border-2 bg-surface p-6 text-center italic text-muted-foreground shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
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

      <div className="w-full overflow-x-auto rounded-md border border-border-2 bg-surface shadow-sm dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen">
        <Table className="min-w-full border-collapse text-sm">
          <TableHeader className="sticky top-0 z-1 bg-surface-2/90 backdrop-blur dark:bg-darkSurface">
            <TableRow>
              {/* Select all checkbox */}
              <TableHead scope="col" className="w-10 border-b border-border-2 px-3 py-2 dark:border-darkSurface">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border-2 text-info-main focus-visible:focus:ring-blue-500 dark:border-gray-600 dark:bg-darkSurface"
                  aria-label="Select all rows"
                />
              </TableHead>
              <TableHead scope="col" className="w-10 border-b border-border-2 dark:border-darkSurface" />
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
          </TableRow>
        </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-darkSurface">
            {sortedGuests.map((guest) => {
              const isExpanded = !!expandedRows[guest.guestId];
              const isSelected = selectedRows.has(guest.bookingRef);
              const activitiesForGuest =
                activitiesMap[guest.guestId] ?? /* fallback */ [];

              return (
                <Fragment key={guest._key ?? guest.guestId}>
                  {/* -------  Main row  ------- */}
                  <TableRow className={`transition-colors ${isSelected ? "bg-info-light/20 dark:bg-blue-900/20" : "odd:bg-surface even:bg-surface-2 hover:bg-primary-50 dark:odd:bg-darkSurface dark:even:bg-darkSurface"}`}>
                    {/* Row selection checkbox */}
                    <TableCell className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRowSelection(guest.bookingRef)}
                        className="h-4 w-4 rounded border-border-2 text-info-main focus-visible:focus:ring-blue-500 dark:border-gray-600 dark:bg-darkSurface"
                        aria-label={`Select booking ${guest.bookingRef}`}
                      />
                    </TableCell>
                    {/* Expand / collapse cell */}
                    <TableCell className="px-3 py-2 text-center">
                      <Button
                      type="button"
                      onClick={() => toggleRow(guest.guestId)}
                      className="rounded-full p-0.5 hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {isExpanded ? "Collapse" : "Expand"} row
                      </span>
                    </Button>
                  </TableCell>

                  {/* Name */}
                  <TableCell className="px-3 py-2">
                    {guest.firstName} {guest.lastName}
                  </TableCell>

                  {/* Booking ref */}
                  <TableCell className="px-3 py-2">
                    <CopyableBookingRef text={guest.bookingRef} />
                  </TableCell>

                  {/* Activity level */}
                  <TableCell className="px-3 py-2">{guest.activityLevel}</TableCell>

                  {/* Refund status badge */}
                  <TableCell className="px-3 py-2">
                    {guest.refundStatus === "Non-Refundable" ? (
                      <span className="inline-flex rounded-full bg-error-light px-2 py-0.5 text-xs font-medium text-error-main">
                        Non‑Refundable
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-success-light px-2 py-0.5 text-xs font-medium text-success-main">
                        Refundable
                      </span>
                    )}
                  </TableCell>

                  {/* Editable balance */}
                  <EditableBalanceCell
                    bookingRef={guest.bookingRef}
                    initialValue={guest.balance}
                  />

                  {/* Paid */}
                  <TableCell className="px-3 py-2 text-end">
                    €{guest.totalPaid.toFixed(2)}
                  </TableCell>

                  {/* Adjust */}
                  <TableCell className="px-3 py-2 text-end">
                    €{guest.totalAdjust.toFixed(2)}
                  </TableCell>
                </TableRow>

                  {/* -------  Expanded details  ------- */}
                  {isExpanded && (
                    <TableRow className="bg-surface-2 even:bg-surface dark:bg-darkSurface dark:even:bg-darkSurface">
                      <TableCell colSpan={9} className="px-4 py-4">
                      <div className="flex flex-col gap-4 md:flex-row">
                        <section className="md:w-1/2">
                          <Inline
                            asChild
                            gap={1}
                            wrap={false}
                            className="mb-1 text-sm font-semibold text-foreground dark:text-darkAccentGreen"
                          >
                            <h4>
                              Activities
                              {activitiesForGuest.length === 0 && (
                                <XMarkIcon
                                  className="h-4 w-4 text-muted-foreground dark:text-darkAccentGreen"
                                  aria-hidden="true"
                                />
                              )}
                            </h4>
                          </Inline>
                          <ActivityList activities={activitiesForGuest} />
                        </section>

                        <section className="md:w-1/2">
                          <Inline
                            asChild
                            gap={1}
                            wrap={false}
                            className="mb-1 text-sm font-semibold text-foreground dark:text-darkAccentGreen"
                          >
                            <h4>
                              Transactions
                              {guest.transactions.length === 0 && (
                                <XMarkIcon
                                  className="h-4 w-4 text-muted-foreground dark:text-darkAccentGreen"
                                  aria-hidden="true"
                                />
                              )}
                            </h4>
                          </Inline>
                          <TransactionList transactions={guest.transactions} />
                        </section>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default React.memo(BookingSearchTable);
