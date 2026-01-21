// Copied from src/components/header/NotificationBanner.tsx
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { useSetBannerRef } from "@acme/ui/context/NotificationBannerContext";
import { useCurrentLanguage } from "@acme/ui/hooks/useCurrentLanguage";
import type { AppLanguage } from "@acme/ui/i18n.config";
import { translatePath } from "@acme/ui/utils/translate-path";

type NotificationBannerCopy = {
  message?: string;
  cta?: string;
  openOffersLabel?: string;
};

type NotificationBannerLocaleModule = {
  default?: NotificationBannerCopy;
} & NotificationBannerCopy;

// i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS selector string.
const SERVER_ROOT_SELECTOR = '[data-notification-banner="root"]';
// i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS selector string.
const SERVER_MESSAGE_SELECTOR = '[data-notification-banner="message"]';
// i18n-exempt -- UI-1000 [ttl=2026-12-31] CSS selector string.
const SERVER_CTA_SELECTOR = '[data-notification-banner="cta"]';

function readServerText(selector: string, fallback: string): string {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") {
    return fallback;
  }
  const node = document.querySelector(selector);
  if (!node) {
    return fallback;
  }
  const value = node.textContent?.trim();
  return value || fallback;
}

function readServerAttr(selector: string, attribute: string, fallback: string): string {
  if (typeof document === "undefined" || typeof document.querySelector !== "function") {
    return fallback;
  }
  const node = document.querySelector<HTMLElement>(selector);
  if (!node) {
    return fallback;
  }
  const value = node.getAttribute(attribute)?.trim();
  return value || fallback;
}

function NotificationBanner({ lang: explicitLang }: { lang?: AppLanguage }): JSX.Element | null {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const { t, ready } = useTranslation("notificationBanner", { lng: lang });
  const router = useRouter();
  const setBannerRef = useSetBannerRef();
  const [isVisible, setIsVisible] = useState(true);
  const rawMessage = useMemo(() => (ready ? (t("message") as string) || "" : ""), [t, ready]);
  const rawCta = useMemo(() => (ready ? (t("cta") as string) || "" : ""), [t, ready]);
  const rawOpenLabel = useMemo(() => (ready ? (t("openOffersLabel") as string) || "" : ""), [t, ready]);

  const [ctaText, setCtaText] = useState<string>(() => readServerText(SERVER_CTA_SELECTOR, rawCta));
  const [messageText, setMessageText] = useState<string>(() =>
    readServerText(SERVER_MESSAGE_SELECTOR, rawMessage)
  );
  const [openLabelText, setOpenLabelText] = useState<string>(() =>
    readServerAttr(SERVER_ROOT_SELECTOR, "aria-label", rawOpenLabel || rawCta)
  );

  useEffect(() => {
    const hidden = localStorage.getItem("bannerHidden") === "true";
    if (hidden) {
      setIsVisible(false);
      localStorage.setItem("bannerHidden", "true");
      setBannerRef(null);
    }
  }, [setBannerRef]);

  useEffect(() => {
    const looksUnresolved = (val: string, key: string) => !val || val === key;
    const messageUnresolved = looksUnresolved(rawMessage, "message");
    const ctaUnresolved = looksUnresolved(rawCta, "cta");
    const openLabelUnresolved = looksUnresolved(rawOpenLabel, "openOffersLabel");

    if (!messageUnresolved) {
      setMessageText(rawMessage);
    }

    if (!ctaUnresolved) {
      setCtaText(rawCta);
    }

    if (!openLabelUnresolved) {
      setOpenLabelText(rawOpenLabel);
    }

    if (!messageUnresolved && !ctaUnresolved && !openLabelUnresolved) {
      return;
    }

    let alive = true;
    // Fallback: dynamically import the JSON for this language
    import(`../locales/${lang}/notificationBanner.json`)
      .then((mod) => {
        if (!alive) return;
        const localeModule = mod as NotificationBannerLocaleModule;
        const data = localeModule.default ?? localeModule;
        if (messageUnresolved) {
          setMessageText(String(data.message ?? rawMessage ?? ""));
        }
        if (ctaUnresolved) {
          setCtaText(String(data.cta ?? rawCta ?? ""));
        }
        if (openLabelUnresolved) {
          const fallbackOpenLabel =
            data.openOffersLabel ?? data.cta ?? rawOpenLabel ?? rawCta ?? "";
          if (fallbackOpenLabel) {
            setOpenLabelText(String(fallbackOpenLabel));
          }
        }
      })
      .catch(() => {
        /* keep existing copy if the fallback fails */
      });

    return () => {
      alive = false;
    };
    // re-run when lang changes or i18n function identity toggles
  }, [lang, rawMessage, rawCta, rawOpenLabel]);

  const openDeals = useCallback(() => router.push(`/${lang}/${translatePath("deals", lang)}`), [router, lang]);
  const close = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("bannerHidden", "true");
    setBannerRef(null);
  }, [setBannerRef]);

  if (!isVisible) return null;

  return (
    <button
      data-notification-banner="root"
      ref={setBannerRef}
      type="button"
      aria-label={openLabelText || ctaText}
      onClick={openDeals}
      className="sticky top-0 z-50 flex min-h-10 min-w-10 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden bg-brand-primary px-6 py-4 text-white shadow-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg dark:text-brand-text motion-safe:animate-slide-down"
    >
      <span
        aria-hidden="true"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className="absolute end-2 top-2 inline-flex size-10 items-center justify-center rounded-full bg-brand-bg/10 text-white transition hover:bg-brand-bg/20 dark:bg-brand-text/20 dark:text-brand-bg dark:hover:bg-brand-text/30"
      >
        <X className="size-6" />
      </span>

      <p className="text-balance text-center text-lg font-semibold leading-snug md:text-xl">
        <span data-notification-banner="message">{messageText}</span>{" "}
        <span data-notification-banner="cta" className="underline underline-offset-4">
          {ctaText}
        </span>
      </p>
    </button>
  );
}

export { NotificationBanner };
export default memo(NotificationBanner);
