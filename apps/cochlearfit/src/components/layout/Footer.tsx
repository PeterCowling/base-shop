"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@acme/i18n";
import { useLocale } from "@/contexts/LocaleContext";
import { withLocale } from "@/lib/routes";
import Container from "@/components/layout/Container";
import Stack from "@/components/layout/Stack";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";

type FooterLink = {
  key: string;
  href: string;
};

const FooterLinkItem = React.memo(function FooterLinkItem({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground underline decoration-primary/40 underline-offset-4 transition hover:text-accent focus-visible:focus-ring"
    >
      {label}
    </Link>
  );
});

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const year = useMemo(() => new Date().getFullYear(), []);
  const copyrightVars = useMemo(() => ({ year }), [year]);

  const policyLinks = useMemo<FooterLink[]>(
    () => [
      { key: "policy.shipping", href: withLocale("/policies/shipping", locale) },
      { key: "policy.returns", href: withLocale("/policies/returns", locale) },
      { key: "policy.privacy", href: withLocale("/policies/privacy", locale) },
      { key: "policy.terms", href: withLocale("/policies/terms", locale) },
    ],
    [locale]
  );

  return (
    <footer className="border-t border-border-1 bg-surface-1/90 py-10">
      <Container className="space-y-6">
        <div className="space-y-2">
          <div className="font-display text-lg font-semibold">{t("site.name") as string}</div>
          <p className="text-sm text-muted-foreground">{t("footer.tagline") as string}</p>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>{t("footer.disclaimer") as string}</p>
          <p>{t("footer.safety") as string}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="font-semibold uppercase tracking-wider text-foreground">
              {t("footer.support") as string}
            </div>
            <div>{SUPPORT_PHONE}</div>
            <div>{SUPPORT_EMAIL}</div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="font-semibold uppercase tracking-wider text-foreground">
              {t("footer.policies") as string}
            </div>
            <Stack className="gap-2">
              {policyLinks.map((link) => (
                <FooterLinkItem key={link.key} href={link.href} label={t(link.key) as string} />
              ))}
            </Stack>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("footer.copyright", copyrightVars) as string}
        </div>
      </Container>
    </footer>
  );
}
