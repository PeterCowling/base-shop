// path: src/components/header/Header.tsx
// --------------------------------------------------------------------------
// Sticky header with scroll-progress bar (React 19 compatible)
// Breakpoint raised to lg (1024 px) to reduce clutter.
// --------------------------------------------------------------------------
/* eslint-disable ds/no-nonlayered-zindex -- BRIK-2145 [ttl=2026-12-31] Header shell and progress bar require fixed stacking above banner/content. */

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { useBannerHeightOrZero } from "@/context/NotificationBannerContext";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useEntryAttribution } from "@/hooks/useEntryAttribution";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTheme } from "@/hooks/useTheme";
import type { AppLanguage } from "@/i18n.config";
import { writeAttribution } from "@/utils/entryAttribution";
import { fireCtaClick } from "@/utils/ga4-events";
import { resolveHeaderPrimaryCtaTarget } from "@/utils/headerPrimaryCtaTarget";

import DesktopHeader from "./DesktopHeader";
import MobileMenu from "./MobileMenu";
import MobileNav from "./MobileNav";

function Header({ lang }: { lang?: AppLanguage }): JSX.Element {
  const { theme } = useTheme();
  const currentLanguage = useCurrentLanguage();
  const resolvedLang = lang ?? currentLanguage;
  const pathname = usePathname();
  const currentAttribution = useEntryAttribution();
  const bannerHeight = useBannerHeightOrZero();

  /* ---------------------------------- state --------------------------------- */
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 768;
  });
  const { scrolled, mouseNearTop, progress } = useScrollProgress();

  /* Event listeners managed by useScrollProgress */
  useEffect(() => {
    const update = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  /* Derived values ---------------------------------------------------------- */
  const headerVisible = !scrolled || mouseNearTop || isLargeScreen;
  const barClass = theme === "dark" ? "progress-bar-dark" : "progress-bar-light";
  const primaryCtaTarget = useMemo(
    () => resolveHeaderPrimaryCtaTarget(resolvedLang, pathname, currentAttribution),
    [currentAttribution, pathname, resolvedLang],
  );

  const onDesktopHeaderCtaClick = useCallback(() => {
    if (primaryCtaTarget.attribution) {
      const payload = {
        ...primaryCtaTarget.attribution,
        source_cta: "desktop_header",
      } as const;
      writeAttribution(payload);
      fireCtaClick(
        { ctaId: "header_check_availability", ctaLocation: "desktop_header" },
        undefined,
        payload,
      );
      return;
    }

    fireCtaClick({ ctaId: "header_check_availability", ctaLocation: "desktop_header" });
  }, [primaryCtaTarget]);

  const onMobileNavCtaClick = useCallback(() => {
    if (primaryCtaTarget.attribution) {
      const payload = {
        ...primaryCtaTarget.attribution,
        source_cta: "mobile_nav",
      } as const;
      writeAttribution(payload);
      fireCtaClick(
        { ctaId: "mobile_nav_check_availability", ctaLocation: "mobile_nav" },
        undefined,
        payload,
      );
      return;
    }

    fireCtaClick({ ctaId: "mobile_nav_check_availability", ctaLocation: "mobile_nav" });
  }, [primaryCtaTarget]);

  /* Render ------------------------------------------------------------------ */
  return (
    <>
      {/* Scroll progress bar -------------------------------------------------- */}
      <div
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className={clsx("progress-bar fixed left-0 top-0 z-[70] h-0.5", barClass)}
        style={{ top: bannerHeight, width: `${progress}%` }}
      />

      {/* Header shell -------------------------------------------------------- */}
      <header
        role="banner"
        className="sticky top-0 z-50 w-full"
        style={{ top: bannerHeight }}
      >
        <MobileNav
          lang={resolvedLang}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          bannerHeight={bannerHeight}
          primaryCtaHref={primaryCtaTarget.href}
          onPrimaryCtaClick={onMobileNavCtaClick}
        />
        <div
          className={`w-full bg-brand-bg/80 shadow-inner backdrop-blur transition-transform duration-300 motion-safe:transform-gpu dark:shadow-md ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}
        >
          <DesktopHeader
            lang={resolvedLang}
            primaryCtaHref={primaryCtaTarget.href}
            onPrimaryCtaClick={onDesktopHeaderCtaClick}
          />
        </div>
        <MobileMenu
          lang={resolvedLang}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          bannerHeight={bannerHeight}
        />
      </header>
    </>
  );
}

export { Header };
export default memo(Header);
