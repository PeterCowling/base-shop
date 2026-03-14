/* eslint-disable ds/no-nonlayered-zindex -- CARYINA-104 sticky site header uses z-50 to overlay page content [ttl=2027-01-01] */
import Image from "next/image";
import Link from "next/link";

import { type Locale } from "@acme/i18n/locales";
import LanguageSwitcher from "@acme/ui/components/molecules/LanguageSwitcher";

import { CartIcon } from "@/components/CartIcon.client";
import { HeaderThemeToggle } from "@/components/HeaderThemeToggle.client";
import { getChromeContent } from "@/lib/contentPacket";

export function Header({ lang }: { lang: string }) {
  const chrome = getChromeContent(lang as "en" | "de" | "it");

  return (
    <header
      className="sticky top-0 z-50 border-b border-border backdrop-blur-md"
      style={{ backgroundColor: "hsl(var(--color-bg) / 0.92)" }}
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center px-6 py-4">
        {/* Logo — crop wrapper clips tagline from the full brand-mark PNG.
            Image is rendered taller than the container; overflow:hidden
            reveals only the wordmark portion (top ~65%). */}
        <Link
          href={`/${lang}`}
          aria-label="Caryina"
          className="inline-flex shrink-0"
        >
          <div className="h-10 w-fit overflow-hidden">
            <Image
              src="/images/caryina-logo.png"
              alt="Caryina"
              width={797}
              height={376}
              className="block w-auto"
              style={{ height: "52px" }}
              priority
            />
          </div>
        </Link>

        {/* Nav — absolutely centered so it sits at the true midpoint of the
            header regardless of logo/icon widths. Hidden on mobile. */}
        <nav
          className="absolute start-1/2 hidden -translate-x-1/2 items-center gap-8 sm:flex"
          aria-label={chrome.header.navAriaLabel}
        >
          <Link
            href={`/${lang}/shop`}
            className="text-xs font-medium tracking-widest uppercase text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            {chrome.header.shop}
          </Link>
          <Link
            href={`/${lang}/about`}
            className="text-xs font-medium tracking-widest uppercase text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            {chrome.header.about}
          </Link>
          <Link
            href={`/${lang}/support`}
            className="text-xs font-medium tracking-widest uppercase text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            {chrome.header.support}
          </Link>
        </nav>

        {/* Icon cluster — pushed to the far right */}
        <div className="ms-auto flex items-center gap-2">
          <LanguageSwitcher current={lang as Locale} />
          <HeaderThemeToggle />
          <CartIcon lang={lang} />
        </div>
      </div>
    </header>
  );
}
