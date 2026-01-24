// src/context/modal/global-modals/BookingModal.tsx
/* -------------------------------------------------------------------------- */
/*  Booking modal container                                                   */
/* -------------------------------------------------------------------------- */

import { useTranslation } from "react-i18next";

import type { BookingGuestOption,BookingModalBuildParams, BookingModalCopy } from "@acme/ui/organisms/modals";
import { resolveSharedToken } from "@acme/ui/shared";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

import { BOOKING_CODE, formatDate } from "../constants";
import { useModal } from "../hooks";
import { BookingModal } from "../lazy-modals";

const BOOKING_FALLBACK_LABEL = "Check availability"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Fallback when translations are missing

export function BookingGlobalModal(): JSX.Element | null {
  const { closeModal, modalData } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });
  const { t: tTokens } = useTranslation("_tokens", { lng: lang });

  const dealId = (() => {
    const raw = (modalData as Partial<{ deal?: unknown }> | null | undefined)?.deal;
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : undefined;
  })();

  const buttonLabel =
    resolveSharedToken(tTokens, "checkAvailability", {
      fallback: () => {
        const direct = tModals("booking.buttonAvailability") as string;
        if (direct && direct.trim() && direct !== "booking.buttonAvailability") {
          return direct;
        }
        const fallback = tModals("booking.buttonAvailability", { lng: "en" }) as string;
        if (fallback && fallback.trim() && fallback !== "booking.buttonAvailability") {
          return fallback;
        }
        return BOOKING_FALLBACK_LABEL;
      },
    }) ?? BOOKING_FALLBACK_LABEL;

  const bookingCopy: BookingModalCopy = {
    title: tModals("booking.title"),
    subTitle: tModals("booking.subTitle"),
    checkInLabel: tModals("booking.checkInLabel"),
    checkOutLabel: tModals("booking.checkOutLabel"),
    guestsLabel: tModals("booking.guestsLabel"),
    overlayLabel: tModals("booking.close"),
    closeLabel: tModals("booking.close"),
    datePlaceholder: tModals("booking.datePlaceholder"),
    buttonLabel,
  };

  const guestOptions: BookingGuestOption[] = Array.from({ length: 8 }, (_, index) => {
    const count = index + 1;
    const key = count === 1 ? "booking.guestsSingle" : "booking.guestsPlural";
    return {
      value: count,
      label: tModals(key, { count }) as string,
    };
  });

  const buildBookingHref = ({ checkIn, checkOut, guests }: BookingModalBuildParams): string => {
    const params = new URLSearchParams({
      checkin: formatDate(checkIn),
      checkout: formatDate(checkOut),
      codice: BOOKING_CODE,
      pax: String(guests),
    });

    if (dealId) {
      params.set("deal", dealId);
      params.set("utm_source", "site");
      params.set("utm_medium", "deal");
      params.set("utm_campaign", dealId);
    }

    return `https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`;
  };

  return (
    <BookingModal
      isOpen
      onClose={closeModal}
      copy={bookingCopy}
      guestOptions={guestOptions}
      buildBookingHref={buildBookingHref}
    />
  );
}
