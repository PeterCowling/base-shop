// src/context/modal/global-modals/FacilitiesModal.tsx
/* -------------------------------------------------------------------------- */
/*  Facilities modal container                                                */
/* -------------------------------------------------------------------------- */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

import { useModal } from "../hooks";
import { FacilitiesModal } from "../lazy-modals";
import type { FacilitiesModalCategory, FacilitiesModalCopy } from "@acme/ui/organisms/modals";

export function FacilitiesGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tFacilities, ready: facilitiesReady } = useTranslation(["landingPage", "modals"], {
    lng: lang,
    keyPrefix: "facilitiesModal",
  });

  const facilitiesCategories = useMemo<FacilitiesModalCategory[]>(() => {
    if (!facilitiesReady) return [];
    const raw = tFacilities("categories", { returnObjects: true }) as unknown;
    if (Array.isArray(raw)) return raw as FacilitiesModalCategory[];
    if (raw && typeof raw === "object") {
      return Object.values(raw as Record<string, FacilitiesModalCategory>);
    }
    return [];
  }, [facilitiesReady, tFacilities]);

  const facilitiesCopy = useMemo<FacilitiesModalCopy>(() => {
    const base: FacilitiesModalCopy = {
      title: tFacilities("title"),
      closeButton: tFacilities("closeButton"),
    };
    if (!facilitiesReady) return { ...base };
    return base;
  }, [facilitiesReady, tFacilities]);

  return (
    <FacilitiesModal isOpen onClose={closeModal} categories={facilitiesCategories} copy={facilitiesCopy} />
  );
}

