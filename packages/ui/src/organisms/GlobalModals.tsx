// packages/ui/src/organisms/GlobalModals.tsx
import { useModal } from "@/context/ModalContext";
import hotel from "@/config/hotel";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { resolveBookingCtaLabel, resolveSharedToken } from "@acme/ui/shared";
import { getDatePlusTwoDays } from "@/utils/dateUtils";
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";
import type {
  BookingModal2Copy,
  BookingModalCopy,
  BookingModalBuildParams,
  BookingGuestOption,
  ContactModalCopy,
  FacilitiesModalCategory,
  FacilitiesModalCopy,
  LanguageModalCopy,
  LanguageOption,
  LocationModalCopy,
  OffersModalCopy,
} from "./modals/types";

// Lazy-loaded modals within the UI package
const BookingModal = lazy(() => import("./modals/BookingModal"));
const BookingModal2 = lazy(() => import("./modals/BookingModal2"));
const LocationModal = lazy(() => import("./modals/LocationModal"));
const ContactModal = lazy(() => import("./modals/ContactModal"));
const OffersModal = lazy(() => import("./modals/OffersModal"));
const FacilitiesModal = lazy(() => import("./modals/FacilitiesModal"));
const LanguageModal = lazy(() => import("./modals/LanguageModal"));

interface BookingData {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  rateType?: "nonRefundable" | "refundable";
  room?: {
    nonRefundableCode?: string;
    refundableCode?: string;
  };
}

const BOOKING_CODE = "45111" as const;
const ENCODED_CONTACT_EMAIL = "aG9zdGVscG9zaXRhbm9AZ21haWwuY29t" as const;
const HOSTEL_ADDRESS = `${hotel.address.streetAddress}, ${hotel.address.postalCode} ${hotel.address.addressLocality}` as const;
const LANGUAGE_ORDER: readonly AppLanguage[] = [
  "de",
  "en",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
  "zh",
  "ar",
  "hi",
  "vi",
  "pl",
  "sv",
  "no",
  "da",
  "hu",
];

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Loader = memo(function Loader(): React.JSX.Element {
  return (
    <div
      role="status"
      aria-label="loading"
      className="fixed inset-0 layer-modal-backdrop grid place-items-center bg-black/20 dark:bg-black/40 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in pointer-coarse:p-4"
    >
      <div className="size-10 animate-spin rounded-full border-4 border-brand-primary/50 border-t-transparent" />
    </div>
  );
});

function GlobalModals(): React.JSX.Element | null {
  const lang = useCurrentLanguage();
  const { activeModal, modalData, openModal, closeModal } = useModal();

  const { t: tModals, ready: modalsReady } = useTranslation("modals", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { t: tFacilities, ready: facilitiesReady } = useTranslation(["landingPage", "modals"], {
    lng: lang,
    keyPrefix: "facilitiesModal",
  });

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [contactEmail, setContactEmail] = useState("");

  useEffect(() => {
    if (activeModal !== "booking2") return;
    const data = (modalData as BookingData | null) ?? null;
    setCheckIn(data?.checkIn ?? "");
    setCheckOut(data?.checkOut ?? (data?.checkIn ? getDatePlusTwoDays(data.checkIn) : ""));
    setAdults(typeof data?.adults === "number" ? data.adults : 1);
  }, [activeModal, modalData]);

  useEffect(() => {
    if (activeModal !== "contact") return;
    if (typeof window === "undefined") return;
    try {
      setContactEmail(window.atob(ENCODED_CONTACT_EMAIL));
    } catch {
      setContactEmail("");
    }
  }, [activeModal]);

  const offersCopy = useMemo<OffersModalCopy>(() => {
    void modalsReady;
    void tokensReady;
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

    return {
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
  }, [modalsReady, tModals, tTokens, tokensReady]);

  const facilitiesCategories = useMemo<FacilitiesModalCategory[]>(() => {
    void facilitiesReady;
    const raw = tFacilities("categories", { returnObjects: true }) as unknown;
    if (Array.isArray(raw)) return raw as FacilitiesModalCategory[];
    if (raw && typeof raw === "object") {
      return Object.values(raw as Record<string, FacilitiesModalCategory>);
    }
    return [];
  }, [facilitiesReady, tFacilities]);

  const facilitiesCopy = useMemo<FacilitiesModalCopy>(
    () => {
      void facilitiesReady;
      return {
        title: tFacilities("title"),
        closeButton: tFacilities("closeButton"),
      };
    },
    [facilitiesReady, tFacilities],
  );

  const bookingCopy = useMemo<BookingModalCopy>(() => {
    void modalsReady;
    void tokensReady;
    const defaultAvailabilityLabel = tModals("booking.buttonAvailability", {
      lng: i18nConfig.fallbackLng,
    }) as string;
    const buttonLabel =
      resolveSharedToken(tTokens, "checkAvailability", {
        fallback: () => {
          const direct = tModals("booking.buttonAvailability") as string;
          if (direct && direct.trim() && direct !== "booking.buttonAvailability") {
            return direct;
          }
          const fallback = tModals("booking.buttonAvailability", { lng: i18nConfig.fallbackLng }) as string;
          if (fallback && fallback.trim() && fallback !== "booking.buttonAvailability") {
            return fallback;
          }
          return defaultAvailabilityLabel;
        },
      }) ?? defaultAvailabilityLabel;

    return {
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
  }, [modalsReady, tModals, tTokens, tokensReady]);

  const guestOptions = useMemo<BookingGuestOption[]>(() => {
    void modalsReady;
    return Array.from({ length: 8 }, (_, index) => {
      const count = index + 1;
      const key = count === 1 ? "booking.guestsSingle" : "booking.guestsPlural";
      return {
        value: count,
        label: tModals(key, { count }) as string,
      };
    });
  }, [modalsReady, tModals]);

  const buildBookingHref = useCallback(
    ({ checkIn: ci, checkOut: co, guests: pax }: BookingModalBuildParams): string => {
      const params = new URLSearchParams({
        checkin: formatDate(ci),
        checkout: formatDate(co),
        codice: BOOKING_CODE,
        pax: String(pax),
      });
      return `https://book.octorate.com/octobook/site/reservation/result.xhtml?${params}`;
    },
    [],
  );

  const booking2Copy = useMemo<BookingModal2Copy>(
    () => {
      void modalsReady;
      return {
        title: tModals("booking2.selectDatesTitle"),
        checkInLabel: tModals("booking2.checkInDate"),
        checkOutLabel: tModals("booking2.checkOutDate"),
        adultsLabel: tModals("booking2.adults"),
        confirmLabel: tModals("booking2.confirm"),
        cancelLabel: tModals("booking2.cancel"),
        overlayLabel: tModals("booking2.dismissOverlay", { defaultValue: tModals("booking2.cancel") }),
      };
    },
    [modalsReady, tModals],
  );

  const locationCopy = useMemo<LocationModalCopy>(
    () => {
      void modalsReady;
      return {
        title: tModals("location.title"),
        closeLabel: tModals("location.close"),
        inputLabel: tModals("location.inputLabel"),
        inputPlaceholder: tModals("location.inputPlaceholder"),
        getDirections: tModals("location.getDirections"),
        justShowMap: tModals("location.justShowMap"),
      };
    },
    [modalsReady, tModals],
  );

  const contactCopy = useMemo<ContactModalCopy>(
    () => {
      void modalsReady;
      return {
        title: tModals("contact.title"),
        description: tModals("contact.description"),
        revealEmail: tModals("contact.revealEmail"),
        closeLabel: tModals("contact.close"),
        footerButton: tModals("contact.buttonClose"),
      };
    },
    [modalsReady, tModals],
  );

  const languageOptions = useMemo<LanguageOption[]>(() => {
    return LANGUAGE_ORDER.filter((lng) => i18nConfig.supportedLngs.includes(lng)).map((lng) => {
      let label = lng.toUpperCase();
      if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
        try {
          const display = new Intl.DisplayNames([lng], { type: "language" });
          const resolved = display.of(lng);
          if (resolved) {
            const [firstGrapheme, ...rest] = Array.from(resolved);
            label = firstGrapheme ? `${firstGrapheme.toLocaleUpperCase(lng)}${rest.join("")}` : resolved;
          }
        } catch {
          label = lng.toUpperCase();
        }
      }
      return { code: lng, label };
    });
  }, []);

  const languageCopy = useMemo<LanguageModalCopy>(
    () => {
      void modalsReady;
      return {
        title: tModals("language.title"),
        closeLabel: tModals("language.close"),
      };
    },
    [modalsReady, tModals],
  );

  const handleConfirm = useCallback((): void => {
    const data = modalData as BookingData | null;
    if (!data) return;
    const { rateType, room } = data;
    if (!rateType || !checkIn || !checkOut) return;
    const roomCode = rateType === "nonRefundable" ? room?.nonRefundableCode : room?.refundableCode;
    if (!roomCode) return;
    window.location.href = `https://book.octorate.com/octobook/site/reservation/confirm.xhtml?codice=45111&checkin=${checkIn}&checkout=${checkOut}&room=${roomCode}&pax=${adults}&children=0&childrenAges=`;
  }, [modalData, checkIn, checkOut, adults]);

  const handleDateChange = useCallback((newCheckIn: string): void => {
    setCheckIn(newCheckIn);
    if (newCheckIn) setCheckOut(getDatePlusTwoDays(newCheckIn));
  }, []);

  const handleReserve = useCallback((): void => {
    closeModal();
    openModal("booking");
  }, [closeModal, openModal]);

  const handleLanguageSelect = useCallback(
    (code: string): void => {
      const data = (modalData as { onSelect?: (nextCode: string) => void } | null) ?? null;
      data?.onSelect?.(code);
      closeModal();
    },
    [modalData, closeModal],
  );

  const languageTheme =
    (activeModal === "language"
      ? ((modalData as { theme?: "light" | "dark" } | null)?.theme ?? undefined)
      : undefined);

  if (!activeModal) return null;

  const languageCurrentCode =
    (activeModal === "language"
      ? ((modalData as { currentCode?: string } | null)?.currentCode ?? lang)
      : lang);

  const languageOptionsOverride =
    activeModal === "language"
      ? (modalData as { options?: LanguageOption[] } | null)?.options ?? null
      : null;

  return (
    <Suspense fallback={<Loader />}>
      {activeModal === "offers" && (
        <OffersModal
          isOpen
          onClose={closeModal}
          onReserve={handleReserve}
          copy={offersCopy}
        />
      )}

      {activeModal === "booking" && (
        <BookingModal
          isOpen
          onClose={closeModal}
          copy={bookingCopy}
          guestOptions={guestOptions}
          buildBookingHref={buildBookingHref}
        />
      )}

      {activeModal === "booking2" && (
        <BookingModal2
          isOpen
          copy={booking2Copy}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          onCheckInChange={(event: ChangeEvent<HTMLInputElement>) => handleDateChange(event.target.value)}
          onCheckOutChange={(event: ChangeEvent<HTMLInputElement>) => setCheckOut(event.target.value)}
          onAdultsChange={(event: ChangeEvent<HTMLInputElement>) => setAdults(parseInt(event.target.value, 10) || 1)}
          onConfirm={handleConfirm}
          onCancel={closeModal}
        />
      )}

      {activeModal === "location" && (
        <LocationModal
          isOpen
          onClose={closeModal}
          copy={locationCopy}
          hostelAddress={HOSTEL_ADDRESS}
        />
      )}

      {activeModal === "contact" && (
        <ContactModal
          isOpen
          onClose={closeModal}
          copy={contactCopy}
          email={contactEmail}
        />
      )}

      {activeModal === "facilities" && (
        <FacilitiesModal
          isOpen
          onClose={closeModal}
          categories={facilitiesCategories}
          copy={facilitiesCopy}
        />
      )}

      {activeModal === "language" && (
        <LanguageModal
          isOpen
          onClose={closeModal}
          options={languageOptionsOverride ?? languageOptions}
          currentCode={languageCurrentCode}
          onSelect={handleLanguageSelect}
          copy={languageCopy}
          theme={languageTheme}
        />
      )}
    </Suspense>
  );
}

export default memo(GlobalModals);
export { GlobalModals };
