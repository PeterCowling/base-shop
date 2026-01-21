// src/context/modal/global-modals.tsx
/* -------------------------------------------------------------------------- */
/*  Global modal switcher component                                           */
/* -------------------------------------------------------------------------- */

import { memo,Suspense } from "react";

import { Booking2GlobalModal } from "./global-modals/Booking2Modal";
import { BookingGlobalModal } from "./global-modals/BookingModal";
import { ContactGlobalModal } from "./global-modals/ContactModal";
import { FacilitiesGlobalModal } from "./global-modals/FacilitiesModal";
import { LanguageGlobalModal } from "./global-modals/LanguageModal";
import { LocationGlobalModal } from "./global-modals/LocationModal";
import { OffersGlobalModal } from "./global-modals/OffersModal";
import { useModal } from "./hooks";
import { Loader } from "./Loader";

export const GlobalModals = memo(function GlobalModals() {
  const { activeModal } = useModal();
  if (!activeModal) return null;

  return (
    <Suspense fallback={<Loader />}>
      {activeModal === "offers" && <OffersGlobalModal />}
      {activeModal === "booking" && <BookingGlobalModal />}
      {activeModal === "booking2" && <Booking2GlobalModal />}
      {activeModal === "location" && <LocationGlobalModal />}
      {activeModal === "contact" && <ContactGlobalModal />}
      {activeModal === "facilities" && <FacilitiesGlobalModal />}
      {activeModal === "language" && <LanguageGlobalModal />}
    </Suspense>
  );
});

