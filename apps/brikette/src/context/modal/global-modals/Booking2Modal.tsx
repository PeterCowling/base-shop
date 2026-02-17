// src/context/modal/global-modals/Booking2Modal.tsx
/* -------------------------------------------------------------------------- */
/*  Booking v2 modal container                                                */
/* -------------------------------------------------------------------------- */

import { type ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { BookingModal2Copy } from "@acme/ui/organisms/modals";

import { DirectPerksBlock } from "@/components/booking/DirectPerksBlock";
import PolicyFeeClarityPanel from "@/components/booking/PolicyFeeClarityPanel";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { getDatePlusTwoDays } from "@/utils/dateUtils";
import {
  fireBeginCheckoutRoomSelected,
  fireHandoffToEngineAndNavigate,
} from "@/utils/ga4-events";

import { BOOKING_CODE } from "../constants";
import { setWindowLocationHref } from "../environment";
import { useModal, useModalPayload } from "../hooks";
import { BookingModal2 } from "../lazy-modals";

export function Booking2GlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const payload = useModalPayload("booking2");
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);

  useEffect(() => {
    setCheckIn(payload?.checkIn ?? "");
    setCheckOut(payload?.checkOut ?? (payload?.checkIn ? getDatePlusTwoDays(payload.checkIn) : ""));
    setAdults(typeof payload?.adults === "number" ? payload.adults : 1);
  }, [payload]);

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
    const roomSku = typeof payload?.roomSku === "string" ? payload.roomSku.trim() : "";
    const plan = payload?.plan === "nr" || payload?.plan === "flex" ? payload.plan : undefined;
    const octorateRateCode =
      typeof payload?.octorateRateCode === "string" ? payload.octorateRateCode.trim() : "";
    const source = typeof payload?.source === "string" ? payload.source : "unknown";
    const itemListId = typeof payload?.item_list_id === "string" ? payload.item_list_id : undefined;

    const params = new URLSearchParams({
      codice: BOOKING_CODE,
      checkin: checkIn,
      checkout: checkOut,
      pax: String(adults),
      children: "0",
      childrenAges: "",
    });

    if (roomSku && plan && octorateRateCode) {
      params.set("room", octorateRateCode);
      const href = `https://book.octorate.com/octobook/site/reservation/confirm.xhtml?${params}`;
      // Compat: begin_checkout fires synchronously (no beacon) during migration window (TASK-05B will decide cleanup policy).
      fireBeginCheckoutRoomSelected({
        source,
        roomSku,
        plan,
        checkin: checkIn,
        checkout: checkOut,
        pax: adults,
        item_list_id: itemListId,
      });
      // Canonical handoff event drives navigation with beacon reliability.
      fireHandoffToEngineAndNavigate({
        handoff_mode: "same_tab",
        engine_endpoint: "confirm",
        checkin: checkIn,
        checkout: checkOut,
        pax: adults,
        source,
        onNavigate: () => setWindowLocationHref(href),
      });
      return;
    }

    const href = `https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`;
    // Canonical handoff event drives navigation with beacon reliability.
    fireHandoffToEngineAndNavigate({
      handoff_mode: "same_tab",
      engine_endpoint: "result",
      checkin: checkIn,
      checkout: checkOut,
      pax: adults,
      source,
      onNavigate: () => setWindowLocationHref(href),
    });
  };

  return (
    <BookingModal2
      isOpen
      copy={booking2Copy}
      checkIn={checkIn}
      checkOut={checkOut}
      adults={adults}
      extraContent={
        <>
          <DirectPerksBlock lang={lang} className="mb-4 rounded-lg bg-brand-surface/30 p-3" />
          <PolicyFeeClarityPanel lang={lang} variant="hostel" className="bg-brand-surface/30" />
        </>
      }
      onCheckInChange={(event: ChangeEvent<HTMLInputElement>) => setCheckIn(event.target.value)}
      onCheckOutChange={(event: ChangeEvent<HTMLInputElement>) => setCheckOut(event.target.value)}
      onAdultsChange={(event: ChangeEvent<HTMLInputElement>) => setAdults(parseInt(event.target.value, 10) || 1)}
      onConfirm={handleConfirm}
      onCancel={closeModal}
    />
  );
}
