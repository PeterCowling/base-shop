import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";

import type { DateRange } from "@/components/booking/DateRangePicker";
import indicativePricesSeed from "@/data/indicative_prices.json";
import type { Room, RoomId } from "@/data/roomsData";
import { useAvailabilityForRoom } from "@/hooks/useAvailabilityForRoom";
import { useRecoveryResumeFallback } from "@/hooks/useRecoveryResumeFallback";
import { HOSTEL_MAX_PAX, isValidPax, isValidStayRange } from "@/utils/bookingDateRules";
import { hydrateBookingSearch, persistBookingSearch } from "@/utils/bookingSearch";
import { formatDate, safeParseIso } from "@/utils/dateUtils";
import { getIndicativeAnchor } from "@/utils/indicativePricing";

type QueryState = "valid" | "invalid" | "absent";

type ReplaceLike = (href: string, options?: { scroll?: boolean }) => void;

type ParamsLike = URLSearchParams | ReadonlyURLSearchParams | null;

export function useRoomDetailBookingState(params: ParamsLike, replace: ReplaceLike, room: Room, roomId: RoomId): {
  range: DateRange;
  queryState: QueryState;
  pickerAdults: number;
  maxPickerAdults: number;
  pickerCheckIn: string;
  pickerCheckOut: string;
  indicativeAnchor: string | null;
  availabilityRoom: ReturnType<typeof useAvailabilityForRoom>["availabilityRoom"];
  showRebuildQuotePrompt: boolean;
  handleRangeChange: (newRange: DateRange | undefined) => void;
  handleAdultsChange: (newAdults: number) => void;
} {
  const hydratedBookingSearch = useMemo(
    () => hydrateBookingSearch(params, { paxKeys: ["pax"] }),
    [params],
  );
  const { showRebuildQuotePrompt } = useRecoveryResumeFallback(params, replace);
  const checkIn = hydratedBookingSearch.search?.checkin ?? "";
  const checkOut = hydratedBookingSearch.search?.checkout ?? "";
  const adults = hydratedBookingSearch.search?.pax ?? 1;

  const queryState: QueryState = !hydratedBookingSearch.search
    ? "absent"
    : hydratedBookingSearch.hasValidSearch
      ? "valid"
      : "invalid";

  const [range, setRange] = useState<DateRange>({
    from: safeParseIso(checkIn),
    to: safeParseIso(checkOut),
  });
  const [pickerAdults, setPickerAdults] = useState(adults);

  useEffect(() => {
    setRange({
      from: safeParseIso(checkIn),
      to: safeParseIso(checkOut),
    });
    setPickerAdults(adults);
  }, [checkIn, checkOut, adults]);

  const pickerCheckIn = range.from ? formatDate(range.from) : checkIn;
  const pickerCheckOut = range.to ? formatDate(range.to) : checkOut;
  const maxPickerAdults = Math.min(HOSTEL_MAX_PAX, room.occupancy ?? HOSTEL_MAX_PAX);

  const handleRangeChange = useCallback(
    (newRange: DateRange | undefined) => {
      setRange(newRange ?? { from: undefined, to: undefined });
      const newCheckin = newRange?.from ? formatDate(newRange.from) : "";
      const newCheckout = newRange?.to ? formatDate(newRange.to) : "";
      if (!newCheckin || !newCheckout) return;
      const nextParams = new URLSearchParams(params?.toString() ?? "");
      nextParams.set("checkin", newCheckin);
      nextParams.set("checkout", newCheckout);
      nextParams.set("pax", String(pickerAdults));
      replace(`?${nextParams.toString()}`, { scroll: false });
      persistBookingSearch({ checkin: newCheckin, checkout: newCheckout, pax: pickerAdults });
    },
    [params, pickerAdults, replace],
  );

  const handleAdultsChange = useCallback(
    (newAdults: number) => {
      setPickerAdults(newAdults);
      const nextParams = new URLSearchParams(params?.toString() ?? "");
      if (pickerCheckIn) nextParams.set("checkin", pickerCheckIn);
      if (pickerCheckOut) nextParams.set("checkout", pickerCheckOut);
      nextParams.set("pax", String(newAdults));
      replace(`?${nextParams.toString()}`, { scroll: false });
      if (pickerCheckIn && pickerCheckOut) {
        persistBookingSearch({ checkin: pickerCheckIn, checkout: pickerCheckOut, pax: newAdults });
      }
    },
    [params, pickerCheckIn, pickerCheckOut, replace],
  );

  const { availabilityRoom } = useAvailabilityForRoom({
    room,
    checkIn: pickerCheckIn,
    checkOut: pickerCheckOut,
    adults: pickerAdults,
  });

  const indicativeAnchor = useMemo(() => {
    if (queryState !== "absent") return null;
    return getIndicativeAnchor(indicativePricesSeed, roomId);
  }, [queryState, roomId]);

  return {
    range,
    queryState,
    pickerAdults,
    maxPickerAdults,
    pickerCheckIn,
    pickerCheckOut,
    indicativeAnchor,
    availabilityRoom,
    showRebuildQuotePrompt,
    handleRangeChange,
    handleAdultsChange,
  };
}

export function isRoomBookingSearchValid(checkIn: string, checkOut: string, pax: number): boolean {
  return Boolean(checkIn) && Boolean(checkOut) && isValidStayRange(checkIn, checkOut) && isValidPax(pax);
}
