// src/context/modal/global-modals/OffersModal.tsx
/* -------------------------------------------------------------------------- */
/*  Offers modal container                                                    */
/* -------------------------------------------------------------------------- */

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

import type { OffersModalCopy } from "@acme/ui/organisms/modals";
import { resolveBookingCtaLabel } from "@acme/ui/shared";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { fireCtaClick } from "@/utils/ga4-events";

import { i18nConfig } from "../constants";
import { useModal } from "../hooks";
import { OffersModal } from "../lazy-modals";

export function OffersGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const router = useRouter();
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });
  const { t: tTokens } = useTranslation("_tokens", { lng: lang });

  const ctaLabel =
    resolveBookingCtaLabel(tTokens, {
      fallback: () => {
        const direct = tModals("offers.button") as string;
        if (direct && direct.trim() && direct !== "offers.button") {
          return direct;
        }
        const fallback = tModals("offers.button", { lng: i18nConfig.fallbackLng }) as string;
        if (fallback && fallback.trim() && fallback !== "offers.button") {
          return fallback;
        }
        return "Reserve Now";
      },
    }) ?? "Reserve Now";

  const offersCopy: OffersModalCopy = {
    title: tModals("offers.title"),
    description: tModals("offers.description"),
    perks: [
      tModals("offers.perks.discount"),
      tModals("offers.perks.breakfast"),
      tModals("offers.perks.drinks"),
      tModals("offers.perks.upgrades"),
    ],
    closeLabel: tModals("offers.close"),
    ctaLabel,
  };

  const handleReserve = useCallback((): void => {
    // TC-01: fire cta_click before navigating to /book
    fireCtaClick({ ctaId: "offers_modal_reserve", ctaLocation: "offers_modal" });
    closeModal();
    router.push(`/${lang}/book`);
  }, [closeModal, router, lang]);

  return <OffersModal isOpen onClose={closeModal} onReserve={handleReserve} copy={offersCopy} />;
}
