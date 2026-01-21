// src/components/Extension.tsx
import React, { useCallback, useMemo, useState } from "react";

import ExtensionPayModal from "./modals/ExtensionPayModal";
import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useBookings from "../../hooks/data/useBookingsData";
import useCityTax from "../../hooks/data/useCityTax";
import useFinancialsRoom from "../../hooks/data/useFinancialsRoom";
import useGuestByRoom from "../../hooks/data/useGuestByRoom";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import { FirebaseBookingOccupant } from "../../types/hooks/data/bookingsData";
import {
  addDays,
  computeNightsRange,
  formatDate,
  getLocalToday,
  isDateWithinRange,
  isToday,
  parseLocalDate,
} from "../../utils/dateUtils";
import { roundDownTo50Cents } from "../../utils/moneyUtils";

interface ExtensionRow {
  occupantId: string;
  occupantIds: string[];
  bookingRef: string;
  fullName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  nightlyRate: number;
  occupantCount: number;
}

function Extension() {
  const todayStr = getLocalToday();

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
  } = useBookings();

  const {
    guestsDetails,
    loading: guestLoading,
    error: guestError,
    validationError: _guestValErr,
  } = useGuestDetails();

  const {
    guestByRoom,
    loading: gbrLoading,
    error: gbrError,
  } = useGuestByRoom();

  const {
    financialsRoom,
    loading: finLoading,
    error: finError,
  } = useFinancialsRoom();

  const {
    activitiesByCodes,
    loading: code14Loading,
    error: code14Error,
  } = useActivitiesByCodeData({ codes: [14] });

  const {
    cityTax,
    loading: cityTaxLoading,
    error: cityTaxError,
  } = useCityTax();

  const inhouseGuests: ExtensionRow[] = useMemo(() => {
    if (!bookings || !guestsDetails) return [];

    const rows: ExtensionRow[] = [];
    const code14Map = activitiesByCodes?.["14"] ?? {};

    Object.entries(bookings).forEach(([bookingRef, occMap]) => {
      const occupantIds = Object.keys(occMap).filter(
        (id) => !id.startsWith("__")
      );
      Object.entries(occMap).forEach(([occId, occ]) => {
        if (occId.startsWith("__")) return;
        const {
          checkInDate,
          checkOutDate,
          roomNumbers = [],
        } = (occ as FirebaseBookingOccupant) || {};
        if (!checkInDate || !checkOutDate) return;
        const isCurrent = isDateWithinRange(todayStr, checkInDate, checkOutDate);
        const isCheckoutToday = isToday(checkOutDate);
        const hasCode14 = Boolean(code14Map[occId]);
        if (!isCurrent && !(isCheckoutToday && !hasCode14)) return;

        const guestDetail = guestsDetails?.[bookingRef]?.[occId];
        const fullName = `${guestDetail?.firstName ?? ""} ${
          guestDetail?.lastName ?? ""
        }`.trim();

        const roomNumber = String(
          guestByRoom?.[occId]?.allocated ?? roomNumbers[0] ?? ""
        );

        const nights = computeNightsRange(checkInDate, checkOutDate).length;
        const totalPaid = financialsRoom?.[bookingRef]?.totalPaid ?? 0;
        const guestCount = occupantIds.length;
        const nightlyRate =
          nights > 0 && guestCount > 0 ? totalPaid / nights / guestCount : 0;

        rows.push({
          occupantId: occId,
          occupantIds,
          bookingRef,
          fullName,
          roomNumber,
          checkInDate,
          checkOutDate,
          nightlyRate,
          occupantCount: guestCount,
        });
      });
    });

    return rows;
  }, [
    bookings,
    guestsDetails,
    guestByRoom,
    financialsRoom,
    todayStr,
    activitiesByCodes,
  ]);

  const [nightsMap, setNightsMap] = useState<Record<string, number>>({});
  const [selectedRow, setSelectedRow] = useState<ExtensionRow | null>(null);
  const [modalExtendType, setModalExtendType] = useState<"single" | "all">(
    "single"
  );

  const [selectedNights, setSelectedNights] = useState<number>(1);

  const getNights = useCallback(
    (id: string) => {
      const val = nightsMap[id];
      return Number.isNaN(val) || val == null ? 1 : val;
    },
    [nightsMap]
  );

  const occupancyMap = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {};
    Object.entries(bookings).forEach(([_, occMap]) => {
      Object.entries(occMap).forEach(([occId, occ]) => {
        if (occId.startsWith("__")) return;
        const {
          checkInDate,
          checkOutDate,
          roomNumbers = [],
        } = (occ as FirebaseBookingOccupant) || {};
        if (!checkInDate || !checkOutDate) return;
        const room = String(
          guestByRoom?.[occId]?.allocated ?? roomNumbers[0] ?? ""
        );
        if (!room) return;
        computeNightsRange(checkInDate, checkOutDate).forEach((date) => {
          if (!map[date]) map[date] = {};
          if (!map[date][room]) map[date][room] = [];
          map[date][room].push(occId);
        });
      });
    });
    return map;
  }, [bookings, guestByRoom]);
  const { getBedCount } = useRoomConfigs();

  const checkAvailability = useCallback(
    (room: string, start: string, nights: number): boolean => {
      const bedCount = getBedCount(room);
      const roomKey = room;

      console.log("[Extension] checkAvailability", {
        room: roomKey,
        start,
        nights,
      });

      const startDate = parseLocalDate(start) || new Date(start);
      const checkOut = formatDate(addDays(startDate, nights));
      for (const date of computeNightsRange(start, checkOut)) {
        const occList = occupancyMap[date]?.[roomKey] ?? [];
        console.log("[Extension] date", date, "occList", occList);

        if (occList.length >= bedCount) {
          console.log(
            `[Extension] room unavailable - occupant(s) ${occList.join(", ")} on ${date}`
          );
          return false;
        }
      }

      console.log("[Extension] room available");

      return true;
    },
    [getBedCount, occupancyMap]
  );
  const availabilityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    inhouseGuests.forEach((row) => {
      const nights = getNights(row.occupantId);
      const result = checkAvailability(
        row.roomNumber,
        row.checkOutDate,
        nights
      );
      console.log("[Extension] availability", {
        occupantId: row.occupantId,
        room: row.roomNumber,
        nights,
        result,
      });
      map[row.occupantId] = result;
    });
    return map;
  }, [inhouseGuests, getNights, checkAvailability]);

  const [sortField, setSortField] = useState<"roomNumber" | "fullName">(
    "roomNumber"
  );
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSort = (field: "roomNumber" | "fullName") => {
    if (field === sortField) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const rows = useMemo(() => {
    const sorted = [...inhouseGuests];
    sorted.sort((a, b) => {
      const aVal = String(a[sortField]).toLowerCase();
      const bVal = String(b[sortField]).toLowerCase();
      const comp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortAsc ? comp : -comp;
    });
    return sorted;
  }, [inhouseGuests, sortField, sortAsc]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const haystack = `${row.fullName} ${row.bookingRef} ${row.roomNumber}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, searchQuery]);

  const bookingColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let useGrey = false;
    filteredRows.forEach((r) => {
      if (!map[r.bookingRef]) {
        map[r.bookingRef] = useGrey
          ? "bg-gray-100 dark:bg-darkSurface"
          : "bg-white dark:bg-darkSurface";
        useGrey = !useGrey;
      }
    });
    return map;
  }, [filteredRows]);

  const loading =
    bookingsLoading ||
    guestLoading ||
    gbrLoading ||
    finLoading ||
    code14Loading ||
    cityTaxLoading;
  const error =
    bookingsError ||
    guestError ||
    gbrError ||
    finError ||
    code14Error ||
    cityTaxError;
  const hasError = Boolean(error);

  return (
    <>
      <div className="min-h-[80vh] p-4 bg-gray-100 font-sans text-gray-800 dark:bg-darkBg dark:text-darkAccentGreen">
        <h1 className="text-5xl font-heading text-primary-main w-full text-center mb-6">
          EXTENSION
        </h1>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-darkSurface">
          {loading && (
            <p className="italic text-gray-600">Loading extension data...</p>
          )}

          {!loading && hasError && (
            <p className="text-red-600">Error loading data: {String(error)}</p>
          )}

          {!loading && !hasError && rows.length === 0 && (
            <p className="italic text-gray-600">No guests in house.</p>
          )}

          {!loading && !hasError && rows.length > 0 && (
            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="extension-search"
                  className="text-sm font-semibold text-gray-700 dark:text-darkAccentGreen"
                >
                  Search
                </label>
                <input
                  id="extension-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by guest name, booking, or room"
                  className="w-full sm:w-80 border rounded px-3 py-2 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
                />
              </div>

              {filteredRows.length === 0 ? (
                <p className="italic text-gray-600">
                  No guests match your search.
                </p>
              ) : (
                <div className="overflow-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-200 dark:bg-darkSurface">
                        <th
                          className="p-2 border-b text-left cursor-pointer"
                          onClick={() => handleSort("roomNumber")}
                        >
                          Room
                          {sortField === "roomNumber" && (sortAsc ? " ↑" : " ↓")}
                        </th>
                        <th
                          className="p-2 border-b text-left cursor-pointer"
                          onClick={() => handleSort("fullName")}
                        >
                          Guest
                          {sortField === "fullName" && (sortAsc ? " ↑" : " ↓")}
                        </th>
                        <th className="p-2 border-b text-left">Check-in</th>
                        <th className="p-2 border-b text-left">Check-out</th>
                        <th className="p-2 border-b text-right">Price</th>
                        <th className="p-2 border-b text-right">Nights</th>
                        <th className="p-2 border-b text-center">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r) => (
                        <tr
                          key={r.occupantId}
                          className={bookingColorMap[r.bookingRef]}
                        >
                          <td className="p-2 border-b">{r.roomNumber}</td>
                          <td className="p-2 border-b">{r.fullName}</td>
                          <td className="p-2 border-b">{r.checkInDate}</td>
                          <td className="p-2 border-b">{r.checkOutDate}</td>
                          <td className="p-2 border-b text-right">
                            {roundDownTo50Cents(r.nightlyRate).toLocaleString(
                              "it-IT",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </td>
                          <td className="p-2 border-b text-right">
                            <input
                              type="number"
                              min="1"
                              value={
                                Number.isNaN(nightsMap[r.occupantId])
                                  ? ""
                                  : nightsMap[r.occupantId] ?? 1
                              }
                              onChange={(e) =>
                                setNightsMap((prev) => ({
                                  ...prev,
                                  [r.occupantId]: parseInt(e.target.value, 10),
                                }))
                              }
                              className="border rounded px-2 py-1 w-20 dark:bg-darkSurface dark:border-darkSurface dark:text-darkAccentGreen"
                            />
                          </td>
                          <td className="p-2 border-b text-center">
                            <div className="flex gap-2 justify-center">
                              <button
                                className={`px-2 py-1 rounded ${
                                  availabilityMap[r.occupantId]
                                    ? "bg-primary-main text-white"
                                    : "bg-gray-400 text-white cursor-not-allowed"
                                }`}
                                onClick={() => {
                                  if (availabilityMap[r.occupantId]) {
                                    setSelectedNights(getNights(r.occupantId));
                                    setSelectedRow(r);
                                    setModalExtendType("single");
                                  }
                                }}
                                disabled={!availabilityMap[r.occupantId]}
                              >
                                {availabilityMap[r.occupantId] ? "Guest" : "N/A"}
                              </button>
                              {r.occupantId === r.occupantIds[0] &&
                                r.occupantCount > 1 && (
                                  <button
                                    className={`px-2 py-1 rounded ${
                                      availabilityMap[r.occupantId]
                                        ? "bg-primary-main text-white"
                                        : "bg-gray-400 text-white cursor-not-allowed"
                                    }`}
                                    onClick={() => {
                                      if (availabilityMap[r.occupantId]) {
                                        setSelectedNights(
                                          getNights(r.occupantId)
                                        );
                                        setSelectedRow(r);
                                        setModalExtendType("all");
                                      }
                                    }}
                                    disabled={!availabilityMap[r.occupantId]}
                                  >
                                    {availabilityMap[r.occupantId]
                                      ? "Booking"
                                      : "N/A"}
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedRow && (
        <ExtensionPayModal
          fullName={selectedRow.fullName}
          nightlyRate={selectedRow.nightlyRate}
          occupantCount={selectedRow.occupantCount}
          nights={selectedNights}
          bookingRef={selectedRow.bookingRef}
          occupantId={selectedRow.occupantId}
          occupantIds={selectedRow.occupantIds}
          checkOutDate={selectedRow.checkOutDate}
          bookingOccupants={
            Object.fromEntries(
              Object.entries(bookings[selectedRow.bookingRef] || {}).filter(
                ([id]) => !id.startsWith("__")
              )
            ) as Record<string, { checkInDate?: string; checkOutDate?: string }>
          }
          cityTaxRecords={cityTax?.[selectedRow.bookingRef] ?? {}}
          onClose={() => {
            setSelectedRow(null);
            setSelectedNights(1);
          }}
          defaultExtendType={modalExtendType}
        />
      )}
    </>
  );
}

export default React.memo(Extension);
