// path: src/components/header/Header.tsx
// --------------------------------------------------------------------------
// Sticky header with scroll-progress bar (React 19 compatible)
// Breakpoint raised to lg (1024 px) to reduce clutter.
// --------------------------------------------------------------------------

import { memo, useState } from "react";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useTheme } from "@/hooks/useTheme";
import type { AppLanguage } from "@/i18n.config";

import DesktopHeader from "./DesktopHeader";
import MobileMenu from "./MobileMenu";
import MobileNav from "./MobileNav";

function Header({ lang }: { lang?: AppLanguage }): JSX.Element {
  const { theme } = useTheme();
  const currentLanguage = useCurrentLanguage();
  const resolvedLang = lang ?? currentLanguage;

  /* ---------------------------------- state --------------------------------- */
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const { scrolled, mouseNearTop, progress } = useScrollProgress();

  /* Event listeners managed by useScrollProgress */

  /* Derived values ---------------------------------------------------------- */
  const showHeader = !scrolled || mouseNearTop;
  const barClass = theme === "dark" ? "progress-bar-dark" : "progress-bar-light";

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
        className={`progress-bar fixed left-0 top-0 z-[70] h-0.5 ${barClass}`}
        style={{ width: `${progress}%` }}
      />

      {/* Header shell -------------------------------------------------------- */}
      <header
        role="banner"
        className={`sticky top-0 z-50 w-full bg-brand-bg/80 shadow-inner backdrop-blur transition-transform
                    duration-300 motion-safe:transform-gpu dark:shadow-md
                    ${showHeader ? "translate-y-0" : "-translate-y-full"}`}
      >
        <MobileNav lang={resolvedLang} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <DesktopHeader lang={resolvedLang} />
        <MobileMenu lang={resolvedLang} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      </header>
    </>
  );
}

export default memo(Header);
