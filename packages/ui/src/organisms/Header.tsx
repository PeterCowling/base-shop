// Copied from src/components/header/Header.tsx
import { forwardRef, type HTMLAttributes, memo, useEffect, useState } from "react";

import { useScrollProgress } from "@acme/design-system/hooks/useScrollProgress";

import { useBannerHeightOrZero } from "../context/NotificationBannerContext";
import { useTheme } from "../hooks/useTheme";
import type { AppLanguage } from "../i18n.config";

import DesktopHeader from "./DesktopHeader";
import MobileMenu from "./MobileMenu";
import MobileNav from "./MobileNav";

// Wrap DOM node to satisfy react/forbid-dom-props for "style"
const ProgressBar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...rest }, ref) => (
  <div ref={ref} className={className} {...rest} />
));
ProgressBar.displayName = "ProgressBar";

function Header({ lang }: { lang?: AppLanguage }): JSX.Element {
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const { scrolled, mouseNearTop, progress } = useScrollProgress();
  const bannerHeight = useBannerHeightOrZero();
  const showHeader = !scrolled || mouseNearTop;

  const [isLargeScreen, setIsLargeScreen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const update = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  const headerVisible = showHeader || isLargeScreen;
  const barClass = theme === "dark" ? "progress-bar-dark" : "progress-bar-light";

  return (
    <>
      <ProgressBar
        role="progressbar"
        aria-label="Page scroll progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className={`progress-bar fixed top-0 left-0 z-[70] h-0.5 ${barClass}`}
        style={{ width: `${progress}%`, top: bannerHeight }}
      />
      <header
        role="banner"
        className="sticky top-0 z-50 w-full"
        // eslint-disable-next-line react/forbid-dom-props -- UI-1000 ttl=2026-12-31 banner offset is runtime-calculated.
        style={{ top: bannerHeight }}
      >
        <MobileNav lang={lang} menuOpen={menuOpen} setMenuOpen={setMenuOpen} bannerHeight={bannerHeight} />
        <div
          className={`w-full bg-brand-bg/80 backdrop-blur shadow-inner dark:shadow-md transition-transform duration-300 motion-safe:transform-gpu ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}
        >
          <DesktopHeader lang={lang} />
        </div>
        <MobileMenu lang={lang} menuOpen={menuOpen} setMenuOpen={setMenuOpen} bannerHeight={bannerHeight} />
      </header>
    </>
  );
}

export { Header };
export default memo(Header);
