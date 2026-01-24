// src/context/modal/global-modals/LocationModal.tsx
/* -------------------------------------------------------------------------- */
/*  Location modal container                                                  */
/* -------------------------------------------------------------------------- */

import { useTranslation } from "react-i18next";

import type { LocationModalCopy } from "@acme/ui/organisms/modals";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";

import { HOSTEL_ADDRESS } from "../constants";
import { useModal } from "../hooks";
import { LocationModal } from "../lazy-modals";

export function LocationGlobalModal(): JSX.Element | null {
  const { closeModal } = useModal();
  const lang = useCurrentLanguage();

  const { t: tModals } = useTranslation("modals", { lng: lang });

  const locationCopy: LocationModalCopy = {
    title: tModals("location.title"),
    closeLabel: tModals("location.close"),
    inputLabel: tModals("location.inputLabel"),
    inputPlaceholder: tModals("location.inputPlaceholder"),
    getDirections: tModals("location.getDirections"),
    justShowMap: tModals("location.justShowMap"),
  };

  return <LocationModal isOpen onClose={closeModal} copy={locationCopy} hostelAddress={HOSTEL_ADDRESS} />;
}
