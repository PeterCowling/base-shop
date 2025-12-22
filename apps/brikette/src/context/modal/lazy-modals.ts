// src/context/modal/lazy-modals.ts
/* -------------------------------------------------------------------------- */
/*  Lazy modal component registry                                             */
/* -------------------------------------------------------------------------- */

/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] lazy import specifiers are not user-facing */
import { lazy, type ComponentType } from "react";
import type {
  BookingModal2Props as UIBookingModal2Props,
  BookingModalProps as UIBookingModalProps,
  ContactModalProps as UIContactModalProps,
  FacilitiesModalProps as UIFacilitiesModalProps,
  LanguageModalProps as UILanguageModalProps,
  LocationModalProps as UILocationModalProps,
  OffersModalProps as UIOffersModalProps,
} from "@acme/ui/organisms/modals";

function lazyModal<T = Record<string, never>>(
  importer: () => Promise<{ default: ComponentType<T> }>,
): ComponentType<T> {
  return lazy(importer) as unknown as ComponentType<T>;
}

export const OffersModal = lazyModal<UIOffersModalProps>(() =>
  import("@acme/ui/organisms/modals/OffersModal"),
);
export const BookingModal = lazyModal<UIBookingModalProps>(() =>
  import("@acme/ui/organisms/modals/BookingModal"),
);
export const BookingModal2 = lazyModal<UIBookingModal2Props>(() =>
  import("@acme/ui/organisms/modals/BookingModal2"),
);
export const LocationModal = lazyModal<UILocationModalProps>(() =>
  import("@acme/ui/organisms/modals/LocationModal"),
);
export const ContactModal = lazyModal<UIContactModalProps>(() =>
  import("@acme/ui/organisms/modals/ContactModal"),
);
export const FacilitiesModal = lazyModal<UIFacilitiesModalProps>(() =>
  import("@acme/ui/organisms/modals/FacilitiesModal"),
);
export const LanguageModal = lazyModal<UILanguageModalProps>(() =>
  import("@acme/ui/organisms/modals/LanguageModal"),
);
