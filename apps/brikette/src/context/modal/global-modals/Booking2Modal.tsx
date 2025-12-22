// src/context/modal/global-modals/Booking2Modal.tsx
/* -------------------------------------------------------------------------- */
/*  Booking v2 modal container                                                */
/* -------------------------------------------------------------------------- */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

import { BOOKING_CODE } from "../constants";
import { setWindowLocationHref } from "../environment";
import { useModal } from "../hooks";
import { BookingModal2 } from "../lazy-modals";
import type { BookingModal2Copy } from "@acme/ui/organisms/modals";

import { getDatePlusTwoDays } from "@/utils/dateUtils";

export function Booking2GlobalModal(): JSX.Element | null {
  const { modalData, closeModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals, ready: modalsReady } = useTranslation("modals", { lng: lang });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);

  useEffect(() => {
    const data = (modalData as Partial<{ checkIn: string; checkOut: string; adults: number }>) ?? {};
    setCheckIn(data.checkIn ?? "");
    setCheckOut(data.checkOut ?? (data.checkIn ? getDatePlusTwoDays(data.checkIn) : ""));
    setAdults(typeof data.adults === "number" ? data.adults : 1);
  }, [modalData]);

  const booking2Copy = useMemo<BookingModal2Copy>(() => {
    const base: BookingModal2Copy = {
      title: tModals("booking2.selectDatesTitle"),
      checkInLabel: tModals("booking2.checkInDate"),
      checkOutLabel: tModals("booking2.checkOutDate"),
      adultsLabel: tModals("booking2.adults"),
      confirmLabel: tModals("booking2.confirm"),
      cancelLabel: tModals("booking2.cancel"),
      overlayLabel: tModals("booking2.dismissOverlay", { defaultValue: tModals("booking2.cancel") }),
    };
    if (!modalsReady) return { ...base };
    return base;
  }, [modalsReady, tModals]);

  const handleConfirm = useCallback((): void => {
    const params = new URLSearchParams({
      codice: BOOKING_CODE,
      checkin: checkIn,
      checkout: checkOut,
      pax: String(adults),
      children: "0",
      childrenAges: "",
    });
    setWindowLocationHref(`https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`);
  }, [checkIn, checkOut, adults]);

  return (
    <BookingModal2
      isOpen
      copy={booking2Copy}
      checkIn={checkIn}
      checkOut={checkOut}
      adults={adults}
      onCheckInChange={(event: ChangeEvent<HTMLInputElement>) => setCheckIn(event.target.value)}
      onCheckOutChange={(event: ChangeEvent<HTMLInputElement>) => setCheckOut(event.target.value)}
      onAdultsChange={(event: ChangeEvent<HTMLInputElement>) => setAdults(parseInt(event.target.value, 10) || 1)}
      onConfirm={handleConfirm}
      onCancel={closeModal}
    />
  );
}

