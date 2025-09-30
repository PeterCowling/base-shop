"use client"; // i18n-exempt -- PB-123 Next.js directive, not user-facing copy [ttl=2025-12-31]

import { useCart } from "@acme/platform-core/contexts/CartContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "../../utils/style";
import ThemeToggle from "../ThemeToggle";
import { CurrencySwitcher } from "../molecules";
import { useTranslations } from "@acme/i18n";

export default function HeaderClient({
  lang,
  initialQty,
  nav = [],
  height = "h-16",
  padding = "px-6",
}: {
  lang: string;
  initialQty: number;
  nav?: { label: string; url: string }[];
  height?: string;
  padding?: string;
}) {
  const [cart] = useCart();
  const [qty, setQty] = useState(initialQty);
  const t = useTranslations();

  // keep qty in sync after hydration
  useEffect(() => {
    setQty(
      (Object.values(cart) as Array<{ qty: number }>).reduce(
        (s, line) => s + line.qty,
        0,
      ),
    );
  }, [cart]);

  const HEADER_CLASS = "flex items-center justify-between"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const NAV_CLASS = "flex items-center gap-6"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const CART_LINK_CLASS = "relative hover:underline"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_CLASS = "absolute -top-2 -end-3 rounded-full px-1.5 text-xs bg-danger text-danger-foreground"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_TOKEN = "--color-danger"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]
  const BADGE_FG_CLASS = "text-danger-foreground"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_FG_TOKEN = "--color-danger-fg"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]
  const navLabelRaw = t("header.nav.aria");
  const navLabel =
    typeof navLabelRaw === "string" &&
    navLabelRaw.trim().length > 0 &&
    navLabelRaw !== "header.nav.aria"
      ? navLabelRaw
      : "Main navigation";

  return (
    <header
      className={cn(HEADER_CLASS, height, padding)}
    >
      <Link href={`/${lang}`} className="text-xl font-bold">
        {t("app.name")}
      </Link>

      <nav className={NAV_CLASS} aria-label={navLabel}>
        {nav.map((item) => (
          <Link
            key={item.url}
            href={item.url.startsWith("/") ? `/${lang}${item.url}` : item.url}
          >
            {item.label}
          </Link>
        ))}
        <CurrencySwitcher />
        <ThemeToggle />
        <Link href={`/${lang}/checkout`} className={CART_LINK_CLASS}>
          {t("header.cart")}
          {qty > 0 && (
            <span
              className={BADGE_CLASS}
              data-token={BADGE_TOKEN}
            >
              <span
                className={BADGE_FG_CLASS}
                data-token={BADGE_FG_TOKEN}
              >
                {qty}
              </span>
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}
