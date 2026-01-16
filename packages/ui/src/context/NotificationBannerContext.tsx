// path: src/context/NotificationBannerContext.tsx
/* -------------------------------------------------------------------------
   Context: NotificationBanner
   -------------------------------------------------------------------------
   Exposes the current banner height (in pixels) to any interested consumer
   and provides a callback-ref that <NotificationBanner> can attach to its
   outer <div>.  Components such as HelpCentreMobileNav can then position
   themselves based on whether the banner is present.
   ------------------------------------------------------------------------- */

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function computeHeight(el: HTMLElement): number {
  try {
    const rect = el.getBoundingClientRect?.();
    const css =
      typeof window !== "undefined" && typeof window.getComputedStyle === "function"
        ? window.getComputedStyle(el)
        : ({ height: "0" } as CSSStyleDeclaration);
    const parsed = parseInt(css.height || "0", 10) || 0;
    const candidates = [
      rect?.height ?? 0,
      parsed,
      el.offsetHeight ?? 0,
      el.clientHeight ?? 0,
      el.scrollHeight ?? 0,
    ];
    return Math.max(...candidates.map((n) => Math.round(Number(n) || 0)));
  } catch {
    return Math.round(el.offsetHeight || 0);
  }
}

interface BannerContextValue {
  /** Current banner height (in px). 0 when banner is hidden. */
  height: number;
  /** Attach as a ref to the banner container. */
  setBannerRef: (el: HTMLElement | null) => void;
}

const BannerContext = createContext<BannerContextValue | undefined>(undefined);

export const BannerProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [height, setHeight] = useState(0);
  const [bannerEl, setBannerEl] = useState<HTMLElement | null>(null);

  /* callback-ref passed to the banner element */
  const setBannerRef = useCallback((el: HTMLElement | null): void => {
    setBannerEl(el);
    setHeight(el ? computeHeight(el) : 0);
  }, []);

  /* keep the height in sync if the banner resizes (orientation change, etc.) */
  useLayoutEffect(() => {
    if (!bannerEl) return;

    const ro = new ResizeObserver(() => setHeight(computeHeight(bannerEl)));
    ro.observe(bannerEl);

    // Fallback: also recompute on window resize (helps jsdom/polyfilled envs)
    const onWinResize = () => setHeight(computeHeight(bannerEl));
    window.addEventListener("resize", onWinResize, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, [bannerEl]);

  const contextValue = useMemo<BannerContextValue>(() => ({ height, setBannerRef }), [height, setBannerRef]);

  return (
    <BannerContext.Provider value={contextValue}>{children}</BannerContext.Provider>
  );
};

/* ─────────── Hooks ─────────── */
export const useBannerHeight = (): number => {
  const ctx = useContext(BannerContext);
  // i18n-exempt -- UI-1000 [ttl=2026-12-31] Developer error message.
  if (!ctx) throw new Error("useBannerHeight must be used within <BannerProvider>");
  return ctx.height;
};

/**
 * Non-throwing variant for consumers that can operate when the provider
 * is absent (e.g. unit tests rendering isolated components).
 * Returns 0 when the provider is not mounted.
 */
export const useBannerHeightOrZero = (): number => {
  const ctx = useContext(BannerContext);
  const [fallbackHeight, setFallbackHeight] = useState(0);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      setFallbackHeight(0);
      return;
    }

    if (ctx?.height) {
      setFallbackHeight(ctx.height);
      return;
    }

    // Fall back to querying the banner element directly if context is stale.
    // i18n-exempt -- UI-1000 ttl=2026-12-31 CSS selector string.
    const el = document.querySelector<HTMLElement>('[data-notification-banner="root"]');
    if (!el) {
      setFallbackHeight(0);
      return;
    }

    const update = () => setFallbackHeight(computeHeight(el));
    update();

    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ctx?.height]);

  return ctx?.height ?? fallbackHeight;
};

export const useSetBannerRef = (): ((el: HTMLElement | null) => void) => {
  const ctx = useContext(BannerContext);
  // i18n-exempt -- UI-1000 [ttl=2026-12-31] Developer error message.
  if (!ctx) throw new Error("useSetBannerRef must be used within <BannerProvider>");
  return ctx.setBannerRef;
};
