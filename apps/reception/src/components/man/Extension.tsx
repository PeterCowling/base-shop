// src/components/Extension.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";

import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";

import useRoomConfigs from "../../hooks/client/checkin/useRoomConfigs";
import useActivitiesByCodeData from "../../hooks/data/useActivitiesByCodeData";
import useBookings from "../../hooks/data/useBookingsData";
import useCityTax from "../../hooks/data/useCityTax";
import useFinancialsRoom from "../../hooks/data/useFinancialsRoom";
import useGuestByRoom from "../../hooks/data/useGuestByRoom";
import useGuestDetails from "../../hooks/data/useGuestDetails";
import { type FirebaseBookingOccupant } from "../../types/hooks/data/bookingsData";
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
import { PageShell } from "../common/PageShell";
import ReceptionSkeleton from "../common/ReceptionSkeleton";

import ExtensionPayModal from "./modals/ExtensionPayModal";

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

      const startDate = parseLocalDate(start) || new Date(start);
      const checkOut = formatDate(addDays(startDate, nights));
      for (const date of computeNightsRange(start, checkOut)) {
        const occList = occupancyMap[date]?.[roomKey] ?? [];

        if (occList.length >= bedCount) {
          return false;
        }
      }

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
          ? "bg-surface-2"
          : "bg-surface";
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
      <PageShell title="EXTENSIONS">
        <div className="bg-surface rounded-xl shadow-lg p-6">
          {loading && <ReceptionSkeleton rows={3} />}

          {!loading && hasError && (
            <p className="text-error-main">Error loading data: {String(error)}</p>
          )}

          {!loading && !hasError && rows.length === 0 && (
            <p className="italic text-muted-foreground">No guests in house.</p>
          )}

          {!loading && !hasError && rows.length > 0 && (
            <div>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="extension-search"
                  className="text-sm font-semibold text-foreground"
                >
                  Search
                </label>
                <Input compatibilityMode="no-wrapper"
                  id="extension-search"
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by guest name, booking, or room"
                  className="w-full sm:w-80 border rounded-lg px-3 py-2"
                />
              </div>

              {filteredRows.length === 0 ? (
                <p className="italic text-muted-foreground">
                  No guests match your search.
                </p>
              ) : (
                <div className="overflow-auto">
                  <Table className="min-w-full border-collapse text-sm">
                    <TableHeader>
                      <TableRow className="bg-surface-3">
                        <TableHead
                          className="p-2 border-b text-start cursor-pointer"
                          onClick={() => handleSort("roomNumber")}
                        >
                          Room
                          {sortField === "roomNumber" && (sortAsc ? " ↑" : " ↓")}
                        </TableHead>
                        <TableHead
                          className="p-2 border-b text-start cursor-pointer"
                          onClick={() => handleSort("fullName")}
                        >
                          Guest
                          {sortField === "fullName" && (sortAsc ? " ↑" : " ↓")}
                        </TableHead>
                        <TableHead className="p-2 border-b text-start">Check-in</TableHead>
                        <TableHead className="p-2 border-b text-start">Check-out</TableHead>
                        <TableHead className="p-2 border-b text-end">Price</TableHead>
                        <TableHead className="p-2 border-b text-end">Nights</TableHead>
                        <TableHead className="p-2 border-b text-center">Pay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((r) => (
                        <TableRow
                          key={r.occupantId}
                          className={bookingColorMap[r.bookingRef]}
                        >
                          <TableCell className="p-2 border-b">{r.roomNumber}</TableCell>
                          <TableCell className="p-2 border-b">{r.fullName}</TableCell>
                          <TableCell className="p-2 border-b">{r.checkInDate}</TableCell>
                          <TableCell className="p-2 border-b">{r.checkOutDate}</TableCell>
                          <TableCell className="p-2 border-b text-end">
                            {roundDownTo50Cents(r.nightlyRate).toLocaleString(
                              "it-IT",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </TableCell>
                          <TableCell className="p-2 border-b text-end">
                            <Input compatibilityMode="no-wrapper"
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
                              className="border rounded-lg px-2 py-1 w-20"
                            />
                          </TableCell>
                          <TableCell className="p-2 border-b text-center">
                            <div className="flex gap-2 justify-center">
                              <Button
                                color={availabilityMap[r.occupantId] ? "primary" : "default"}
                                tone={availabilityMap[r.occupantId] ? "solid" : "soft"}
                                size="sm"
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
                              </Button>
                              {r.occupantId === r.occupantIds[0] &&
                                r.occupantCount > 1 && (
                                  <Button
                                    color={availabilityMap[r.occupantId] ? "primary" : "default"}
                                    tone={availabilityMap[r.occupantId] ? "solid" : "soft"}
                                    size="sm"
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
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </PageShell>

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
