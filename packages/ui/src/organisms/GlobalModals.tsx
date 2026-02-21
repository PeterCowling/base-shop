// packages/ui/src/organisms/GlobalModals.tsx
import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import hotel from "../config/hotel";
import { useModal } from "../context/ModalContext";
import { useCurrentLanguage } from "../hooks/useCurrentLanguage";
import { type AppLanguage,i18nConfig } from "../i18n.config";
import { resolveBookingCtaLabel } from "../shared";

import type {
  ContactModalCopy,
  FacilitiesModalCategory,
  FacilitiesModalCopy,
  LanguageModalCopy,
  LanguageOption,
  LocationModalCopy,
  OffersModalCopy,
} from "./modals/types";

// Lazy-loaded modals within the UI package
const LocationModal = lazy(() => import("./modals/LocationModal"));
const ContactModal = lazy(() => import("./modals/ContactModal"));
const OffersModal = lazy(() => import("./modals/OffersModal"));
const FacilitiesModal = lazy(() => import("./modals/FacilitiesModal"));
const LanguageModal = lazy(() => import("./modals/LanguageModal"));

const ENCODED_CONTACT_EMAIL = "aG9zdGVscG9zaXRhbm9AZ21haWwuY29t" as const;
const HOSTEL_ADDRESS = `${hotel.address.streetAddress}, ${hotel.address.postalCode} ${hotel.address.addressLocality}` as const;
const _formatDate = (date: Date): string => {
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
  const { activeModal, modalData, openModal: _openModal, closeModal } = useModal();

  const { t: tModals, ready: modalsReady } = useTranslation("modals", { lng: lang });
  const { t: tTokens, ready: tokensReady } = useTranslation("_tokens", { lng: lang });
  const { t: tFacilities, ready: facilitiesReady } = useTranslation(["landingPage", "modals"], {
    lng: lang,
    keyPrefix: "facilitiesModal",
  });

  const [contactEmail, setContactEmail] = useState("");

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
    const candidates = [
      i18nConfig.fallbackLng as AppLanguage,
      ...((i18nConfig.supportedLngs ?? []) as AppLanguage[]),
    ];
    if (!candidates.includes(lang)) {
      candidates.unshift(lang);
    }
    const unique = Array.from(new Set(candidates));

    return unique.map((lng) => {
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
  }, [lang]);

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

  const handleReserve = useCallback((): void => {
    closeModal();
  }, [closeModal]);

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
