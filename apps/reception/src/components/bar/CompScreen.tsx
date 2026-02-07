// src/components/bar/CompScreen.tsx

import React, { useMemo, useState } from "react";

import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useBookingsData from "../../hooks/data/useBookingsData";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import useGuestsByBooking from "../../hooks/data/useGuestsByBooking";
import usePreorder from "../../hooks/data/usePreorder";

import ModalPreorderDetails from "./ModalPreorderDetails";

interface NightData {
  breakfast?: string;
  drink1?: string;
  drink2?: string;
}

type PreorderData = Record<string, NightData>;

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
  NA: "bg-gray-200 text-gray-900 dark:bg-darkSurface dark:text-darkAccentGreen",
  continental: "bg-info-main text-white",
  cooked: "bg-success-main text-white",
  // fallback style
  default: "bg-primary-main text-white",
};

const getPlanClasses = (plan: string) =>
  planColorMap[plan.toLowerCase()] ?? planColorMap.default;

const TableRow: React.FC<{
  row: RowData;
  idx: number;
  onDoubleClick: (row: RowData) => void;
  showPlan?: boolean;
}> = React.memo(({ row, idx, onDoubleClick, showPlan }) => (
  <tr
    className={`${
      idx % 2 === 0
        ? "bg-muted/50 dark:bg-darkSurface"
        : "bg-white dark:bg-darkSurface"
    } hover:bg-primary-light/30 transition-colors cursor-pointer`}
    onDoubleClick={() => onDoubleClick(row)}
  >
    <td className="px-4 py-3 whitespace-nowrap">{row.bookingRef}</td>
    <td className="px-4 py-3">{row.occId}</td>
    <td className="px-4 py-3">{row.guestName}</td>
    {showPlan && (
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getPlanClasses(
            row.plan
          )}`}
        >
          {row.plan}
        </span>
      </td>
    )}
  </tr>
));

TableRow.displayName = "TableRow";

const TableSection: React.FC<TableSectionProps> = ({
  rows,
  title,
  accent,
  onRowDoubleClick,
  showPlan = false,
}) => {
  const accentBase = accent === "success" ? "success-main" : "error-main";

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-primary-main dark:text-darkAccentGreen">{title}</h2>
      <div className="max-h-[60vh] overflow-auto rounded-lg shadow focus-visible:ring-1 focus-visible:ring-info-main dark:bg-darkSurface">
        <table className="min-w-[40rem] w-full table-auto text-start text-sm">
          <thead
            className={`sticky top-0 bg-${accentBase} text-white uppercase ${accent === 'error' ? 'dark:bg-darkAccentOrange' : 'dark:bg-darkSurface'}`}
          >
            <tr>
              <th className="px-4 py-3">Booking&nbsp;Ref</th>
              <th className="px-4 py-3">Occ.&nbsp;ID</th>
              <th className="px-4 py-3">Guest&nbsp;Name</th>
              {showPlan && <th className="px-4 py-3">Plan</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showPlan ? 4 : 3}
                  className="px-4 py-6 text-center text-gray-600 dark:text-darkAccentGreen"
                >
                  No data
                </td>
              </tr>
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
          </tbody>
        </table>
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

    const isEligibleForPreorder = (id: string) => {
      const occPre = preorder?.[id] as PreorderData | undefined;
      if (!occPre) return false;
      return Object.values(occPre).some(
        (night) =>
          night.breakfast !== "NA" ||
          night.drink1 !== "NA" ||
          night.drink2 !== "NA"
      );
    };

    const eligibleIds: string[] = [];
    const notEligibleIds: string[] = [];
    checkedInOccIds.forEach((id) =>
      (isEligibleForPreorder(id) ? eligibleIds : notEligibleIds).push(id)
    );

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
      const firstNightKey = occPre ? Object.keys(occPre)[0] : undefined;
      const plan =
        firstNightKey && occPre
          ? occPre[firstNightKey].breakfast ?? "NA"
          : "NA";

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
      <div className="flex min-h-[30vh] items-center justify-center">
        <svg
          className="h-8 w-8 animate-spin text-primary-main"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 1120 12h-4l3.536 3.536A8 8 0 014 12z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-10 p-6 font-body dark:bg-darkBg dark:text-darkAccentGreen">
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
