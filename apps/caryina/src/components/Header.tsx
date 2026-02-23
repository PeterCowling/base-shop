import Link from "next/link";

import { BrandMark } from "@/components/BrandMark/BrandMark";

export function Header({ lang }: { lang: string }) {
  return (
    <header
      className="border-b border-solid"
      style={{
        borderBottomColor: "hsl(var(--color-border-muted))",
      }}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href={`/${lang}`}
          aria-label="Caryina"
          style={{ display: "inline-flex" }}
        >
          <BrandMark trigger="mount" />
        </Link>
        <nav className="flex items-center gap-5 text-sm" aria-label="Primary">
          <Link href={`/${lang}/shop`} className="hover:underline">
            Shop
          </Link>
          <Link href={`/${lang}/support`} className="hover:underline">
            Support
          </Link>
          <Link
            href={`/${lang}/checkout`}
            className="rounded-full border border-solid px-4 py-2 hover:bg-muted"
            style={{
              borderColor: "hsl(var(--color-border-default))",
            }}
          >
            Checkout
          </Link>
        </nav>
      </div>
    </header>
  );
}
