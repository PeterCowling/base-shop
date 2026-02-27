import Link from "next/link";

import { CartIcon } from "@/components/CartIcon.client";
import { ThemeModeSwitch } from "@/components/ThemeModeSwitch";

export function Header({ lang }: { lang: string }) {
  return (
    <header
      className="sticky top-0 shadow-sm backdrop-blur-sm"
      style={{ backgroundColor: "hsl(var(--color-bg) / 0.88)" }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href={`/${lang}`}
          aria-label="Caryina"
          className="inline-flex shrink-0"
        >
          {/* i18n-exempt -- CARYINA-104 [ttl=2026-12-31] */}
          <svg
            viewBox="0 0 320 88"
            className="h-10 w-auto"
            aria-label="Caryina"
            role="img"
          >
            <text
              fontFamily="var(--font-cormorant-garamond)"
              fontSize="46"
              letterSpacing="7"
              x="20"
              y="59"
            >
              <tspan fontWeight="500" fill="hsl(var(--color-primary))">Car</tspan>
              <tspan fontWeight="300" fill="hsl(var(--color-accent))">y</tspan>
              <tspan fontWeight="500" fill="hsl(var(--color-primary))">ina</tspan>
            </text>
          </svg>
        </Link>
        <nav className="flex items-center gap-5" aria-label="Primary">
          <Link
            href={`/${lang}/shop`}
            className="hidden sm:block text-xs font-medium tracking-widest uppercase opacity-70 transition-opacity hover:opacity-100"
          >
            Shop
          </Link>
          <Link
            href={`/${lang}/support`}
            className="hidden sm:block text-xs font-medium tracking-widest uppercase opacity-70 transition-opacity hover:opacity-100"
          >
            Support
          </Link>
          <ThemeModeSwitch />
          <CartIcon lang={lang} />
        </nav>
      </div>
    </header>
  );
}
