"use client"; // i18n-exempt -- PB-123 Next.js directive, not user-facing copy [ttl=2025-12-31]

import { useCart } from "@acme/platform-core/contexts/CartContext";
import { useTranslations } from "@acme/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../../utils/style";
import ThemeToggle from "../ThemeToggle";
import { CurrencySwitcher } from "../molecules";
import { Stack } from "../atoms/primitives/Stack";

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

  const navLabel = t("header.nav.aria");

  if (lang === "en") {
    return (
      <EnglishHeader
        appName={t("app.name")}
        cartLabel={t("header.cart")}
        lang={lang}
        nav={nav}
        navLabel={navLabel}
        qty={qty}
      />
    );
  }

  const HEADER_CLASS = "flex items-center justify-between"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const NAV_CLASS = "flex items-center gap-6"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const CART_LINK_CLASS = "relative hover:underline"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_CLASS = "absolute -top-2 -end-3 rounded-full px-1.5 text-xs bg-danger text-danger-foreground"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_TOKEN = "--color-danger"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]
  const BADGE_FG_CLASS = "text-danger-foreground"; // i18n-exempt -- PB-123 CSS classes only [ttl=2025-12-31]
  const BADGE_FG_TOKEN = "--color-danger-fg"; // i18n-exempt -- PB-123 design token name [ttl=2025-12-31]

  return (
    <header className={cn(HEADER_CLASS, height, padding)}>
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
            <span className={BADGE_CLASS} data-token={BADGE_TOKEN}>
              <span className={BADGE_FG_CLASS} data-token={BADGE_FG_TOKEN}>
                {qty}
              </span>
            </span>
          )}
        </Link>
      </nav>
    </header>
  );
}

/* eslint-disable ds/no-hardcoded-copy -- STYLING-0001: className tokens and layout strings only */
function EnglishHeader({
  lang,
  nav,
  qty,
  appName,
  cartLabel,
  navLabel,
}: {
  lang: string;
  nav: { label: string; url: string }[];
  qty: number;
  appName: string;
  cartLabel: string;
  navLabel: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const translations = useTranslations();

  const navItems = useMemo(
    () =>
      nav.map((item) => {
        const href = item.url.startsWith("/")
          ? `/${lang}${item.url}`
          : item.url;
        return { ...item, href };
      }),
    [lang, nav],
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const updateScrollState = () => {
      setScrolled(window.scrollY > 24);
    };
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const original = document.body.style.overflow;
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (!pathname || !href.startsWith("/")) {
      return false;
    }
    const normalize = (value: string) => {
      const trimmed = value.replace(/\/$/, "");
      return trimmed === "" ? "/" : trimmed;
    };
    return normalize(pathname) === normalize(href);
  };

  const menuId = "loket-menu-overlay";
  const toggleLabel = menuOpen
    ? translations("header.menu.close")
    : translations("header.menu.open");
  const navToggleLabel = menuOpen
    ? translations("header.menu.navigationClose")
    : translations("header.menu.navigationOpen");
  const preferencesLabel = translations("header.menu.preferences");
  const closeActionLabel = translations("actions.close");

  const renderNavContent = (masked: boolean) => (
    <>
      <div className="loket-nav-left">
        <Link
          href={`/${lang}`}
          className="loket-logo font-display"
          tabIndex={masked ? -1 : undefined}
        >
          {appName}
        </Link>
      </div>
      <div className="loket-nav-center">
        <ul className="loket-nav-list" aria-hidden={masked || undefined}>
          {navItems.map((item) => (
            <li key={item.href} className="loket-nav-item">
              <Link
                href={item.href}
                className={cn(
                  "loket-nav-link",
                  isActive(item.href) && "is-active",
                )}
                tabIndex={masked ? -1 : undefined}
              >
                {item.label}
              </Link>
              <span
                aria-hidden="true"
                className={cn(
                  "loket-active-marker",
                  isActive(item.href) && "is-active",
                )}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="loket-nav-right">
        <button
          type="button"
          aria-label={toggleLabel}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
          className={cn("loket-burger", menuOpen && "is-open")}
          tabIndex={masked ? -1 : undefined}
        >
          <span className="sr-only">{navToggleLabel}</span>
          <span className="loket-burger-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </>
  );

  return (
    <header className="loket-header" data-loket-scrolled={scrolled ? "true" : "false"}>
      <nav className="loket-nav" aria-label={navLabel}>
        {renderNavContent(false)}
      </nav>
      <div
        className={cn(
          "loket-nav loket-nav-mask",
          scrolled && "loket-nav-mask--open",
        )}
        aria-hidden="true"
      >
        {renderNavContent(true)}
      </div>
      <div className="loket-nav-spacer" aria-hidden="true" />

      <aside
        id={menuId}
        className={cn(
          "fixed inset-0 z-40 flex flex-col px-6 pb-10 pt-16 transition-opacity duration-300",
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
          "loket-menu-panel",
        )}
        aria-hidden={!menuOpen}
        role="dialog"
        aria-modal={menuOpen || undefined}
      >
        <div className="flex items-center justify-between text-xs uppercase loket-menu-caption">
          <p>{appName}</p>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="rounded-full border border-muted/30 px-4 py-2 min-h-11 min-w-11 text-bg transition hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bg loket-text-button"
          >
            {closeActionLabel}
          </button>
        </div>
        <nav className="mt-12" aria-label={navLabel}>
          <Stack asChild gap={6} className="text-4xl uppercase loket-menu-link">
            <ul>
              {navItems.map((item) => (
                <li key={`drawer-${item.href}`}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex w-full items-center justify-between border-b border-muted/20 pb-4 text-inherit transition hover:text-bg/80"
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-base">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Stack>
        </nav>

        <div className="mt-auto flex flex-col gap-6 text-sm uppercase text-bg/80 loket-menu-caption">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-bg/50">{preferencesLabel}</p>
            <div className="flex flex-wrap items-center gap-4">
              <CurrencySwitcher />
              <ThemeToggle />
            </div>
          </div>
          <Link
            href={`/${lang}/checkout`}
            onClick={() => setMenuOpen(false)}
            className="inline-flex items-center justify-between border-t border-muted/20 pt-4 text-base transition hover:text-bg/80 loket-menu-caption"
          >
            {cartLabel}
            {qty > 0 && (
              <span
                data-testid="cart-qty-badge"
                data-cy="cart-qty-badge"
                className="ms-4 inline-flex items-center justify-center rounded-full bg-bg/15 px-3 py-1 text-sm tracking-normal text-bg"
              >
                {qty}
              </span>
            )}
          </Link>
        </div>
      </aside>
    </header>
  );
}
/* eslint-enable ds/no-hardcoded-copy */
