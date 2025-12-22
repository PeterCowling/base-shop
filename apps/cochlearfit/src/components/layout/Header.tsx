"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";
import Container from "@/components/layout/Container";
import Inline from "@/components/layout/Inline";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CartIconButton from "@/components/CartIconButton";

type NavItem = {
  key: string;
  href: string;
};

type NavLinkProps = {
  href: string;
  label: string;
};

const NavLink = React.memo(function NavLink({ href, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-accent focus-visible:focus-ring"
    >
      {label}
    </Link>
  );
});

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();

  const navItems = useMemo<NavItem[]>(
    () => [
      { key: "nav.shop", href: withLocale("/shop", locale) },
      { key: "nav.faq", href: withLocale("/faq", locale) },
      { key: "nav.sizing", href: withLocale("/sizing", locale) },
      { key: "nav.about", href: withLocale("/about", locale) },
      { key: "nav.contact", href: withLocale("/contact", locale) },
    ],
    [locale]
  );

  return (
    <header className="sticky top-0 z-20 border-b border-border-1 bg-surface-1/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-3 py-4">
        <Link
          href={withLocale("/", locale)}
          className="font-display text-lg font-semibold tracking-tight text-foreground"
        >
          {t("site.name") as string}
        </Link>
        <nav className="hidden flex-1 md:block">
          <Inline className="items-center justify-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.key} href={item.href} label={t(item.key) as string} />
            ))}
          </Inline>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <CartIconButton />
        </div>
      </Container>
      <div className="md:hidden">
        <Container className="pb-3">
          <Inline className="flex-wrap justify-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.key} href={item.href} label={t(item.key) as string} />
            ))}
          </Inline>
        </Container>
      </div>
    </header>
  );
}
