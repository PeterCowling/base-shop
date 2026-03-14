// src/components/bar/CompScreen.tsx

import React, { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as DSTableRow,
} from "@acme/design-system";

import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useBookingsData from "../../hooks/data/useBookingsData";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import useGuestsByBooking from "../../hooks/data/useGuestsByBooking";
import usePreorder from "../../hooks/data/usePreorder";
import { parseLocalDate } from "../../utils/dateUtils";
import { Spinner } from "../common/Spinner";

import ModalPreorderDetails from "./ModalPreorderDetails";

interface NightData {
  breakfast?: string;
  drink1?: string;
  drink2?: string;
  /** txnId backref written by Prime bridge write (breakfast field is NOT overwritten) */
  breakfastTxnId?: string;
}

type PreorderData = Record<string, NightData>;

function getTonightNightKey(checkInDate: string): string | null {
  if (!checkInDate) return null;
  const checkIn = parseLocalDate(checkInDate);
  if (!checkIn) return null;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const checkInStart = new Date(checkIn);
  checkInStart.setHours(0, 0, 0, 0);
  const daysSince = Math.floor(
    (todayStart.getTime() - checkInStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `night${Math.max(1, daysSince + 1)}`;
}

export function isEligibleForPreorderTonight(
  preorderData: PreorderData | undefined,
  checkInDate: string
): boolean {
  if (!preorderData || !checkInDate) return false;
  const nightKey = getTonightNightKey(checkInDate);
  if (!nightKey) return false;
  const tonight = preorderData[nightKey];
  if (!tonight) return false;
  return (
    tonight.breakfast !== "NA" ||
    tonight.drink1 !== "NA" ||
    tonight.drink2 !== "NA"
  );
}

interface SelectedOccState {
  occId: string;
  preorder: PreorderData | null;
  occupantCheckIn: string;
  guestName: string;
}

interface RowData {
  bookingRef: string;
  occId: string;
  guestName: string;
  plan: string;
  preorder: PreorderData | null;
  occupantCheckIn: string;
}

interface TableSectionProps {
  rows: RowData[];
  title: string;
  accent: "success" | "error";
  onRowDoubleClick: (row: RowData) => void;
  showPlan?: boolean;
}

const planColorMap: Record<string, string> = {
  NA: "bg-surface-3 text-foreground",
  continental: "bg-accent text-foreground",
  cooked: "bg-success-main text-success-fg",
  preordered: "bg-primary-main text-primary-fg",
  // fallback style
  default: "bg-primary-main text-primary-fg",
};

const getPlanClasses = (plan: string) =>
  planColorMap[plan.toLowerCase()] ?? planColorMap.default;

const TableRow: React.FC<{
  row: RowData;
  idx: number;
  onDoubleClick: (row: RowData) => void;
  showPlan?: boolean;
}> = React.memo(({ row, idx, onDoubleClick, showPlan }) => (
  <DSTableRow
    className={`${
      idx % 2 === 0
        ? "bg-muted/50"
        : "bg-surface"
    } hover:bg-primary-soft transition-colors cursor-pointer`}
    onDoubleClick={() => onDoubleClick(row)}
  >
    <TableCell className="px-4 py-3 whitespace-nowrap">{row.bookingRef}</TableCell>
    <TableCell className="px-4 py-3">{row.occId}</TableCell>
    <TableCell className="px-4 py-3">{row.guestName}</TableCell>
    {showPlan && (
      <TableCell className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getPlanClasses(
            row.plan
          )}`}
        >
          {row.plan}
        </span>
      </TableCell>
    )}
  </DSTableRow>
));

TableRow.displayName = "TableRow";

const TableSection: React.FC<TableSectionProps> = ({
  rows,
  title,
  accent,
  onRowDoubleClick,
  showPlan = false,
}) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-primary-main">{title}</h2>
      <div className="max-h-60vh overflow-auto rounded-lg shadow focus-visible:ring-1 focus-visible:ring-primary-main">
        <Table className="min-w-40rem w-full table-auto text-start text-sm">
          <TableHeader
            className={`sticky top-0 ${accent === "success" ? "bg-success-main" : "bg-error-main"} ${accent === "success" ? "text-success-fg" : "text-danger-fg"} uppercase`}
          >
            <DSTableRow>
              <TableHead className="px-4 py-3">Booking&nbsp;Ref</TableHead>
              <TableHead className="px-4 py-3">Occ.&nbsp;ID</TableHead>
              <TableHead className="px-4 py-3">Guest&nbsp;Name</TableHead>
              {showPlan && <TableHead className="px-4 py-3">Plan</TableHead>}
            </DSTableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <DSTableRow>
                <TableCell
                  colSpan={showPlan ? 4 : 3}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No data
                </TableCell>
              </DSTableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={row.occId}
                  row={row}
                  idx={idx}
                  onDoubleClick={onRowDoubleClick}
                  showPlan={showPlan}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

const CompScreen: React.FC = React.memo(() => {
  const { activitiesByCodes, loading: loadingActs } = useActivitiesByCodeData({
    codes: [12, 13, 14],
  });
  const { preorder, loading: loadingPreorder } = usePreorder();
  const { bookings, loading: loadingBookings } = useBookingsData();
  const {
    guestsDetails,
    loading: loadingGuestDetails,
    validationError: _guestValErr,
  } = useGuestDetails();
  const { guestsByBooking, loading: loadingGBB } = useGuestsByBooking();

  const [selectedOcc, setSelectedOcc] = useState<SelectedOccState | null>(null);

  const allLoading =
    loadingActs ||
    loadingPreorder ||
    loadingBookings ||
    loadingGuestDetails ||
    loadingGBB;

  const {
    eligibleData,
    notEligibleData,
  }: { eligibleData: RowData[]; notEligibleData: RowData[] } = useMemo(() => {
    if (allLoading) return { eligibleData: [], notEligibleData: [] };

    const occIds12 = new Set(Object.keys(activitiesByCodes["12"] ?? {}));
    const occIds13 = new Set(Object.keys(activitiesByCodes["13"] ?? {}));
    const occIds14 = new Set(Object.keys(activitiesByCodes["14"] ?? {}));

    const checkedInOccIds = [...occIds12].filter(
      (id) => !occIds13.has(id) && !occIds14.has(id)
    );

    const eligibleIds: string[] = [];
    const notEligibleIds: string[] = [];
    checkedInOccIds.forEach((id) => {
      const bookingRefForElig = guestsByBooking?.[id]?.reservationCode ?? "N/A";
      const occBookingForElig = bookings?.[bookingRefForElig]?.[id];
      const checkInDateForElig =
        occBookingForElig &&
        "checkInDate" in occBookingForElig &&
        typeof occBookingForElig.checkInDate === "string"
          ? occBookingForElig.checkInDate
          : "";
      (isEligibleForPreorderTonight(
        preorder?.[id] as PreorderData | undefined,
        checkInDateForElig
      )
        ? eligibleIds
        : notEligibleIds
      ).push(id);
    });

    const buildRow = (id: string): RowData => {
      const bookingRef = guestsByBooking?.[id]?.reservationCode ?? "N/A";
      const occupantBooking = bookings?.[bookingRef]?.[id];
      const details = occupantBooking
        ? guestsDetails?.[bookingRef]?.[id]
        : undefined;

      const guestName = details
        ? `${details.firstName} ${details.lastName}`
        : id;

      const occupantCheckIn =
        occupantBooking &&
        "checkInDate" in occupantBooking &&
        typeof occupantBooking.checkInDate === "string"
          ? occupantBooking.checkInDate
          : "";
      const occPre = (preorder?.[id] as PreorderData) ?? null;
      const tonightKey = occupantCheckIn
        ? getTonightNightKey(occupantCheckIn)
        : null;
      // If breakfastTxnId is present, the guest placed a Prime breakfast order.
      // Show "preordered" instead of the raw txnId or entitlement value.
      // Otherwise fall back to the existing breakfast value (plan name or entitlement marker).
      const tonightPreorder = tonightKey && occPre ? occPre[tonightKey] : null;
      const plan = tonightPreorder?.breakfastTxnId
        ? "preordered"
        : (tonightPreorder?.breakfast ?? "NA");

      return {
        bookingRef,
        occId: id,
        guestName,
        plan,
        preorder: occPre,
        occupantCheckIn,
      };
    };

    return {
      eligibleData: eligibleIds.map(buildRow),
      notEligibleData: notEligibleIds.map(buildRow),
    };
  }, [
    allLoading,
    activitiesByCodes,
    preorder,
    guestsByBooking,
    bookings,
    guestsDetails,
  ]);

  const handleRowDoubleClick = (row: RowData) =>
    setSelectedOcc({
      occId: row.occId,
      preorder: row.preorder,
      occupantCheckIn: row.occupantCheckIn,
      guestName: row.guestName,
    });

  if (allLoading) {
    return (
      <div className="flex min-h-30vh items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-10 p-6 font-body">
      {selectedOcc && (
        <ModalPreorderDetails
          preorder={selectedOcc.preorder}
          occupantCheckIn={selectedOcc.occupantCheckIn}
          guestName={selectedOcc.guestName}
          onClose={() => setSelectedOcc(null)}
        />
      )}

      <TableSection
        rows={eligibleData}
        title="Eligible"
        accent="success"
        showPlan
        onRowDoubleClick={handleRowDoubleClick}
      />

      <TableSection
        rows={notEligibleData}
        title="Not Eligible"
        accent="error"
        onRowDoubleClick={handleRowDoubleClick}
      />
    </div>
  );
});

CompScreen.displayName = "CompScreen";
export default CompScreen;
