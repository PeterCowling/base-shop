// src/context/modal/global-modals/BookingModal.tsx
/* -------------------------------------------------------------------------- */
/*  Booking modal container                                                   */
/* -------------------------------------------------------------------------- */

import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { resolveSharedToken } from "@acme/ui/shared";

import { BookingModal } from "../lazy-modals";
import { useModal } from "../hooks";
import { BOOKING_CODE, formatDate } from "../constants";
import type { BookingModalCopy, BookingModalBuildParams, BookingGuestOption } from "@acme/ui/organisms/modals";

const BOOKING_FALLBACK_LABEL = "Check availability"; // i18n-exempt -- LINT-1007 [ttl=2026-12-31] Fallback when translations are missing

export function BookingGlobalModal(): JSX.Element | null {
  const { closeModal, modalData } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals, ready: modalsReady } = useTranslation("modals", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });

  const dealId = useMemo(() => {
    const raw = (modalData as Partial<{ deal?: unknown }> | null | undefined)?.deal;
    if (typeof raw !== "string") return undefined;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : undefined;
  }, [modalData]);

  const bookingCopy = useMemo<BookingModalCopy>(() => {
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

    const baseCopy: BookingModalCopy = {
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

    if (!modalsReady || !tokensReady) {
      return { ...baseCopy };
    }
    return baseCopy;
  }, [modalsReady, tModals, tTokens, tokensReady]);

  const guestOptions = useMemo<BookingGuestOption[]>(() => {
    const options = Array.from({ length: 8 }, (_, index) => {
      const count = index + 1;
      const key = count === 1 ? "booking.guestsSingle" : "booking.guestsPlural";
      return {
        value: count,
        label: tModals(key, { count }) as string,
      };
    });
    if (!modalsReady) return [...options];
    return options;
  }, [modalsReady, tModals]);

  const buildBookingHref = useCallback(({ checkIn, checkOut, guests }: BookingModalBuildParams): string => {
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
  }, [dealId]);

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
