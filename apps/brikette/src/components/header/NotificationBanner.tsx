/* ────────────────────────────────────────────────────────────────
   src/components/header/NotificationBanner.tsx
   Offers banner – one interactive control (no nested buttons)
---------------------------------------------------------------- */
import type { KeyboardEvent } from "react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { X } from "@/icons";

import { useSetBannerRef } from "@/context/NotificationBannerContext";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import { translatePath } from "@/utils/translate-path";

type NotificationBannerCopy = {
  message?: string;
  cta?: string;
  openOffersLabel?: string;
};

type NotificationBannerLocaleModule = {
  default?: NotificationBannerCopy;
} & NotificationBannerCopy;

const BANNER_DATA_ATTRIBUTE = "data-notification-banner" as const;
type BannerDataValue = "root" | "message" | "cta";

const createBannerSelector = <Value extends BannerDataValue>(
  value: Value
): `[${typeof BANNER_DATA_ATTRIBUTE}="${Value}"]` =>
  `[${BANNER_DATA_ATTRIBUTE}="${value}"]`;

const SERVER_ROOT_SELECTOR = createBannerSelector("root");
const SERVER_MESSAGE_SELECTOR = createBannerSelector("message");
const SERVER_CTA_SELECTOR = createBannerSelector("cta");

const ACTIVATION_KEYS = new Set(["Enter", " ", "Space", "Spacebar"]);

const ensureResolvedValue = (value: string, placeholder: string, fallback: string): string => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === placeholder) {
    return fallback;
  }
  return trimmed;
};

type Invocable = (...args: never[]) => void;

type NativeEventWithControls = {
  preventDefault?: Invocable;
  stopPropagation?: Invocable;
  stopImmediatePropagation?: Invocable;
  cancelBubble?: boolean;
  returnValue?: boolean;
};

const callHandler = (handler: unknown, context: unknown): void => {
  if (typeof handler === "function") {
    (handler as Invocable).call(context ?? undefined);
  }
};

const callDescriptorHandler = (
  target: unknown,
  key: keyof NativeEventWithControls,
  context: unknown
): void => {
  if (!target || (typeof target !== "object" && typeof target !== "function")) {
    return;
  }
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (!descriptor) {
    return;
  }

  if ("value" in descriptor) {
    callHandler(descriptor.value, context);
    const current = (target as NativeEventWithControls)[key];
    if (descriptor.value !== current) {
      callHandler(current, context);
    }
    return;
  }
  callHandler((target as NativeEventWithControls)[key], context);
};

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
  const { t: tModals } = useTranslation("modals", { lng: lang });
  const router = useRouter();
  const setBannerRef = useSetBannerRef();
  const [isVisible, setIsVisible] = useState(true);
  const dismissButtonRef = useRef<HTMLButtonElement | null>(null);
  const dismissIconRef = useRef<HTMLSpanElement | null>(null);
  const rawMessage = ready ? ((t("message") as string) || "").trim() : "";
  const rawCta = ready ? ((t("cta") as string) || "").trim() : "";
  const rawOpenLabel = ready ? ((t("openOffersLabel") as string) || "").trim() : "";
  const [ctaText, setCtaText] = useState<string>(() => readServerText(SERVER_CTA_SELECTOR, rawCta));
  const [messageText, setMessageText] = useState<string>(() =>
    readServerText(SERVER_MESSAGE_SELECTOR, rawMessage)
  );
  const [openLabelText, setOpenLabelText] = useState<string>(() => {
    const preferred = ensureResolvedValue(rawOpenLabel, "openOffersLabel", rawCta);
    const serverLabel = readServerAttr(SERVER_ROOT_SELECTOR, "aria-label", preferred);
    return ensureResolvedValue(serverLabel, "openOffersLabel", rawCta);
  });

  /* check persisted state on mount */
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
    } else {
      setOpenLabelText((current) => ensureResolvedValue(current, "openOffersLabel", rawCta));
    }

    if (!messageUnresolved && !ctaUnresolved && !openLabelUnresolved) {
      return;
    }

    let alive = true;
    import(`@/locales/${lang}/notificationBanner.json`)
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
          const fallbackOpenLabel = ensureResolvedValue(
            String(data.openOffersLabel ?? data.cta ?? rawOpenLabel ?? rawCta ?? ""),
            "openOffersLabel",
            rawCta
          );
          setOpenLabelText(fallbackOpenLabel);
        }
      })
      .catch(() => {
        /* keep server-rendered copy */
      });

    return () => {
      alive = false;
    };
  }, [lang, rawMessage, rawCta, rawOpenLabel]);

  const openDeals = useCallback(
    () => router.push(`/${lang}/${translatePath("deals", lang)}`),
    [router, lang]
  );

  const close = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem("bannerHidden", "true");
    setBannerRef(null);
  }, [setBannerRef]);

  const closeLabel = (() => {
    const resolved = (t("closeLabel") as string) || "";
    if (resolved && resolved !== "closeLabel") {
      return resolved;
    }
    const modalClose = (tModals("booking.close") as string) || "";
    if (modalClose && modalClose !== "booking.close") {
      return modalClose;
    }
    return resolved || modalClose || "Close";
  })();

  const stopDomPropagation = useCallback(
    (event: Event) => {
      const native = event as NativeEventWithControls;
      if (typeof native.stopImmediatePropagation === "function") {
        native.stopImmediatePropagation();
      }
      if (typeof native.stopPropagation === "function") {
        native.stopPropagation();
      }
      native.cancelBubble = true;
      native.returnValue = false;
      close();
    },
    [close]
  );

  const registerDismissButton = useCallback(
    (node: HTMLButtonElement | null) => {
      if (dismissButtonRef.current) {
        dismissButtonRef.current.removeEventListener("click", stopDomPropagation, true);
      }
      if (node) {
        node.addEventListener("click", stopDomPropagation, true);
      }
      dismissButtonRef.current = node;
    },
    [stopDomPropagation]
  );

  const registerDismissIcon = useCallback(
    (node: HTMLSpanElement | null) => {
      if (dismissIconRef.current) {
        dismissIconRef.current.removeEventListener("click", stopDomPropagation, true);
      }
      if (node) {
        node.addEventListener("click", stopDomPropagation, true);
      }
      dismissIconRef.current = node;
    },
    [stopDomPropagation]
  );

  const handleActivation = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (ACTIVATION_KEYS.has(event.key) || event.code === "Space") {
        const nativeEvent = event.nativeEvent as NativeEventWithControls | undefined;
        callHandler(event.preventDefault, event);
        callDescriptorHandler(event, "preventDefault", event);
        if (nativeEvent && nativeEvent !== event) {
          callHandler(nativeEvent.preventDefault, nativeEvent);
          callDescriptorHandler(nativeEvent, "preventDefault", nativeEvent);
          nativeEvent.returnValue = false;
        }
        openDeals();
      }
    },
    [openDeals]
  );

  if (!isVisible) return null;

  return (
    <div className="sticky top-0">
      <div
        data-notification-banner="root"
        ref={setBannerRef}
        role="button"
        tabIndex={0}
        aria-label={openLabelText || ctaText}
        onClick={openDeals}
        onKeyDown={handleActivation}
        className="relative flex min-h-10 w-full min-w-10 cursor-pointer items-center justify-center gap-2 overflow-hidden bg-brand-primary px-6 py-4 pe-16 text-brand-bg shadow-md transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg motion-safe:animate-slide-down dark:text-brand-text"
      >
        <p className="text-balance text-center text-lg font-semibold leading-snug md:text-xl">
          <span data-notification-banner="message" className="font-semibold md:font-bold">
            {messageText}
          </span>{" "}
          <span
            data-notification-banner="cta"
            className="font-semibold underline underline-offset-4 md:font-bold"
          >
            {ctaText}
          </span>
        </p>
        <button
          type="button"
          ref={registerDismissButton}
          aria-label={closeLabel}
          className="absolute end-2 top-2 inline-flex size-11 items-center justify-center rounded-full bg-brand-bg/10 text-brand-bg transition hover:bg-brand-bg/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-bg dark:bg-brand-text/20 dark:text-brand-bg dark:hover:bg-brand-text/30"
        >
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center"
            ref={registerDismissIcon}
          >
            <X className="size-6" />
          </span>
        </button>
      </div>
    </div>
  );
}

export default memo(NotificationBanner);

export const __test__ = {
  createBannerSelector,
  ensureResolvedValue,
  callHandler,
  callDescriptorHandler,
  readServerText,
  readServerAttr,
};
