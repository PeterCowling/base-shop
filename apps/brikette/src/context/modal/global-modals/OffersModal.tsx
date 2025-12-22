// src/context/modal/global-modals/OffersModal.tsx
/* -------------------------------------------------------------------------- */
/*  Offers modal container                                                    */
/* -------------------------------------------------------------------------- */

import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { resolveBookingCtaLabel } from "@acme/ui/shared";

import { useModal } from "../hooks";
import { OffersModal } from "../lazy-modals";
import { i18nConfig } from "../constants";
import type { OffersModalCopy } from "@acme/ui/organisms/modals";

export function OffersGlobalModal(): JSX.Element | null {
  const { closeModal, openModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals, ready: modalsReady } = useTranslation("modals", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });

  const offersCopy = useMemo<OffersModalCopy>(() => {
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

    const baseCopy: OffersModalCopy = {
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

    if (!modalsReady || !tokensReady) {
      return { ...baseCopy };
    }
    return baseCopy;
  }, [modalsReady, tModals, tTokens, tokensReady]);

  const handleReserve = useCallback((): void => {
    closeModal();
    openModal("booking");
  }, [closeModal, openModal]);

  return <OffersModal isOpen onClose={closeModal} onReserve={handleReserve} copy={offersCopy} />;
}

