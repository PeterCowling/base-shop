import Link from "next/link";

import { BrandMark } from "@/components/BrandMark/BrandMark";
import { ThemeModeSwitch } from "@/components/ThemeModeSwitch";

export function Header({ lang }: { lang: string }) {
  return (
    <header
      className="sticky top-0 shadow-sm backdrop-blur-sm"
      style={{ backgroundColor: "hsl(var(--color-bg) / 0.88)" }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-5">
        <Link
          href={`/${lang}`}
          aria-label="Caryina"
          className="inline-flex"
        >
          <BrandMark trigger="hover" />
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
          <Link
            href={`/${lang}/checkout`}
            className="btn-primary rounded-full px-5 py-2 text-xs font-medium tracking-widest uppercase"
          >
            Checkout
          </Link>
        </nav>
      </div>
    </header>
  );
}
