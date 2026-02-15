// src/context/modal/global-modals/Booking2Modal.tsx
/* -------------------------------------------------------------------------- */
/*  Booking v2 modal container                                                */
/* -------------------------------------------------------------------------- */

import { type ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BookingModal2Copy } from "@acme/ui/organisms/modals";

import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import i18n from "@/i18n";
import { getDatePlusTwoDays } from "@/utils/dateUtils";
import { fireBeginCheckoutGeneric } from "@/utils/ga4-events";

import { BOOKING_CODE } from "../constants";
import { setWindowLocationHref } from "../environment";
import { useModal } from "../hooks";
import { BookingModal2 } from "../lazy-modals";

export function Booking2GlobalModal(): JSX.Element | null {
  const { modalData, closeModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);

  useEffect(() => {
    const data = (modalData as Partial<{ checkIn: string; checkOut: string; adults: number }>) ?? {};
    setCheckIn(data.checkIn ?? "");
    setCheckOut(data.checkOut ?? (data.checkIn ? getDatePlusTwoDays(data.checkIn) : ""));
    setAdults(typeof data.adults === "number" ? data.adults : 1);
  }, [modalData]);

  useEffect(() => {
    // Ensure policies + terms label resolve without flashing raw keys in the modal.
    void i18n.loadNamespaces?.(["bookPage", "footer"]);
  }, []);

  const booking2Copy: BookingModal2Copy = {
    title: tModals("booking2.selectDatesTitle"),
    checkInLabel: tModals("booking2.checkInDate"),
    checkOutLabel: tModals("booking2.checkOutDate"),
    adultsLabel: tModals("booking2.adults"),
    confirmLabel: tModals("booking2.confirm"),
    cancelLabel: tModals("booking2.cancel"),
    overlayLabel: tModals("booking2.dismissOverlay", { defaultValue: tModals("booking2.cancel") }),
  };

  const handleConfirm = (): void => {
    fireBeginCheckoutGeneric({
      source: "booking2_modal",
      checkin: checkIn,
      checkout: checkOut,
      pax: adults,
    });

    const params = new URLSearchParams({
      codice: BOOKING_CODE,
      checkin: checkIn,
      checkout: checkOut,
      pax: String(adults),
      children: "0",
      childrenAges: "",
    });

    setWindowLocationHref(`https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`);
  };

  return (
    <BookingModal2
      isOpen
      copy={booking2Copy}
      checkIn={checkIn}
      checkOut={checkOut}
      adults={adults}
      extraContent={<PolicyFeeClarityPanel lang={lang} variant="hostel" className="bg-brand-surface/30" />}
      onCheckInChange={(event: ChangeEvent<HTMLInputElement>) => setCheckIn(event.target.value)}
      onCheckOutChange={(event: ChangeEvent<HTMLInputElement>) => setCheckOut(event.target.value)}
      onAdultsChange={(event: ChangeEvent<HTMLInputElement>) => setAdults(parseInt(event.target.value, 10) || 1)}
      onConfirm={handleConfirm}
      onCancel={closeModal}
    />
  );
}
