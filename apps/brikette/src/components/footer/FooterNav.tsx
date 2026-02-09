// src/components/footer/FooterNav.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";

import type { AppLanguage } from "@/i18n.config";

import { FooterTextLink } from "./FooterLinks";
import type { FooterGroup } from "./footerTypes";

type FooterNavProps = {
  navGroups: FooterGroup[];
  isActiveLink: (href: string) => boolean;
  prefetch?: boolean;
  lang?: AppLanguage;
};

const FooterNav = memo(function FooterNav({
  navGroups,
  isActiveLink,
  prefetch,
  lang,
}: FooterNavProps): JSX.Element {
  const { t } = useTranslation("footer", { lng: lang });

  return (
    <nav aria-label={t("navAriaLabel") as string}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {navGroups.map((group) => (
          <div key={group.key} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-bg/70 dark:text-brand-text/70">
              {group.heading}
            </p>
            <ul className="space-y-1">
              {group.links.map((link) => {
                const isActive = !link.external && isActiveLink(link.href);
                return (
                  <li key={link.key}>
                    <FooterTextLink
                      href={link.href}
                      external={link.external}
                      newTab={link.newTab}
                      prefetch={prefetch}
                      isActive={isActive}
                      size="sm"
                    >
                      {link.label}
                    </FooterTextLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
});

export default FooterNav;
export { FooterNav };
