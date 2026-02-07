"use client";

/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy XA shell pending design/i18n overhaul */

import { type ReactNode } from "react";
import Link from "next/link";
import {
  BackpackIcon,
  HeartIcon,
  MoonIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  SunIcon,
} from "@radix-ui/react-icons";

import AnnouncementBar from "@acme/ui/components/organisms/AnnouncementBar";
import { Section } from "@acme/design-system/atoms/Section";
import { CurrencySwitcher } from "@acme/design-system/molecules";
import { Input } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { Grid } from "@acme/design-system/atoms/Grid";

import { XaMegaMenu } from "./XaMegaMenu";
import { XaSupportDock } from "./XaSupportDock.client";
import { useCart } from "../contexts/XaCartContext";
import { useWishlist } from "../contexts/XaWishlistContext";
import { siteConfig } from "../lib/siteConfig";
import { toWhatsappHref } from "../lib/support";
import {
  XA_ALLOWED_CATEGORIES,
  XA_ALLOWED_DEPARTMENTS,
  XA_CATEGORY_LABELS,
  formatLabel,
  getCategoryHref,
} from "../lib/xaCatalog";
import { useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

export function XaShell({ children }: { children: ReactNode }) {
  const whatsappHref = siteConfig.showSocialLinks
    ? toWhatsappHref(siteConfig.whatsappNumber) ?? undefined
    : undefined;
  const showSupportDock = siteConfig.showContactInfo || siteConfig.showSocialLinks;
  const showSupportLinks = showSupportDock;
  const [cart] = useCart();
  const cartCount = Object.values(cart).reduce((sum, line) => sum + line.qty, 0);
  const [wishlist] = useWishlist();
  const wishlistCount = wishlist.length;
  const { isDark, setMode } = useThemeMode();
  const categoryLinks = XA_ALLOWED_CATEGORIES.map((category) => ({
    label: XA_CATEGORY_LABELS[category],
    href: getCategoryHref(category),
  }));

  return (
    <div className="flex min-h-dvh flex-col">
      {whatsappHref ? (
        <AnnouncementBar
          text="Support via WhatsApp — tap to chat" // i18n-exempt -- XA-0006: demo promo bar copy
          href={whatsappHref}
          closable
        />
      ) : null}

      <header className="border-b bg-surface-1">
        <Section as="div" padding="none" className="px-4">
          <Stack gap={2} className="py-3">
            <div className="grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-4">
              <nav aria-label="Primary" className="justify-self-start">
                <Inline gap={5} className="flex-wrap">
                  {XA_ALLOWED_DEPARTMENTS.map((department) => (
                    <XaMegaMenu
                      key={department}
                      label={formatLabel(department)}
                      department={department}
                    />
                  ))}
                </Inline>
              </nav>

              <Link
                href="/"
                className="inline-flex min-h-11 min-w-11 items-center justify-self-center font-semibold"
              >
                {siteConfig.brandName}
              </Link>

              <nav aria-label="Utilities" className="justify-self-end">
                <Inline gap={4}>
                  <Link
                    href="/wishlist"
                    className="relative inline-flex min-h-11 min-w-11 items-center justify-center"
                    aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount})` : ""}`}
                    title="Wishlist"
                  >
                    <HeartIcon className="h-4 w-4" />
                    {wishlistCount ? (
                      <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                        {wishlistCount}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMode(isDark ? "light" : "dark")}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center"
                    aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                    title={isDark ? "Light mode" : "Dark mode"}
                  >
                    {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </button>
                  <Link
                    href="/account/login"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center"
                    aria-label="Account"
                    title="Account"
                  >
                    <PersonIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/cart"
                    className="relative inline-flex min-h-11 min-w-11 items-center justify-center"
                    aria-label={`Cart${cartCount ? ` (${cartCount})` : ""}`}
                    title="Cart"
                  >
                    <BackpackIcon className="h-4 w-4" />
                    {cartCount ? (
                      <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background">
                        {cartCount}
                      </span>
                    ) : null}
                  </Link>
                </Inline>
              </nav>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-6 border-t pt-2">
              <nav aria-label="Secondary" className="flex-1">
                <Inline gap={5} className="flex-wrap">
                  <Link
                    href="/new-in"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
                  >
                    New In
                  </Link>
                  <Link
                    href="/sale"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
                  >
                    Sale
                  </Link>
                  <Link
                    href="/designers"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
                  >
                    Brands
                  </Link>
                  {categoryLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="inline-flex min-h-11 min-w-11 items-center text-sm font-medium hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </Inline>
              </nav>

              <div className="flex items-center gap-3">
                <form action="/search" method="get" className="relative hidden md:block">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input name="q" placeholder="Search" className="w-44 pl-9 text-sm" />
                </form>
                <Link
                  href="/search"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Stack>
        </Section>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="xa-footer border-t border-border-1 text-foreground">
        <Section as="div" padding="none" className="px-6 py-12 md:px-12">
          <Grid columns={{ base: 2, md: 4 }} gap={8}>
            <div className="col-span-2 md:col-span-1">
                <div className="text-xl font-semibold uppercase tracking-[0.18em] text-foreground">
                  {siteConfig.brandName}
                </div>
              </div>

            <div>
              <Stack gap={2}>
                {showSupportLinks ? (
                  <Link
                    href="/service-center"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground hover:text-foreground"
                  >
                    Service center
                  </Link>
                ) : null}
                <Stack gap={1}>
                  <Link
                    href="/pages/how-to-shop"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    How to shop
                  </Link>
                  <Link
                    href="/pages/cryptocurrency-payment"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Cryptocurrency payments
                  </Link>
                  <Link
                    href="/pages/shipping-policy"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Shipping
                  </Link>
                  <Link
                    href="/pages/return-policy"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Returns
                  </Link>
                  <Link
                    href="/pages/privacy-policy"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/pages/terms-of-service"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Terms
                  </Link>
                </Stack>
              </Stack>
            </div>

            <div>
              <Stack gap={2}>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  Company info
                </div>
                <Stack gap={1}>
                  <Link
                    href="/pages/about-us"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    About
                  </Link>
                  {showSupportLinks ? (
                    <Link
                      href="/pages/contact-us"
                      className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                    >
                      Contact
                    </Link>
                  ) : null}
                  <Link
                    href="/pages/payment-and-pricing"
                    className="inline-flex min-h-11 min-w-11 items-center text-sm uppercase tracking-wide text-foreground/80 hover:text-foreground"
                  >
                    Payments and pricing
                  </Link>
                </Stack>
              </Stack>
            </div>

            <div>
              <Stack gap={2}>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                  Currency
                </div>
                <CurrencySwitcher />
              </Stack>
            </div>
          </Grid>
        </Section>
      </footer>

      {showSupportDock ? <XaSupportDock /> : null}
    </div>
  );
}
