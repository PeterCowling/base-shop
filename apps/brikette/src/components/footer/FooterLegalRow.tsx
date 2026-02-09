// src/components/footer/FooterLegalRow.tsx
import { memo } from "react";

import { Cluster, Stack } from "@/components/ui/flex";

import { FooterTextLink } from "./FooterLinks";
import type { FooterLink } from "./footerTypes";

type FooterLegalRowProps = {
  legalLinks: FooterLink[];
  isActiveLink: (href: string) => boolean;
  prefetch?: boolean;
  copyright: string;
  backToTopLabel: string;
};

const FooterLegalRow = memo(function FooterLegalRow({
  legalLinks,
  isActiveLink,
  prefetch,
  copyright,
  backToTopLabel,
}: FooterLegalRowProps): JSX.Element {
  return (
    <Stack className="gap-3 text-sm md:flex-row md:items-center md:justify-between">
      <Cluster as="ul" className="items-center">
        {legalLinks.map((link, index) => {
          const isActive = !link.external && isActiveLink(link.href);
          return (
            <li key={link.key}>
              {index > 0 ? (
                <span
                  aria-hidden
                  className="mx-2 text-brand-bg/60 dark:text-brand-text/60"
                >
                  •
                </span>
              ) : null}
              <FooterTextLink
                href={link.href}
                external={link.external}
                newTab={link.newTab}
                prefetch={prefetch}
                isActive={isActive}
                variant="legal"
              >
                {link.label}
              </FooterTextLink>
            </li>
          );
        })}
      </Cluster>
      <Cluster className="items-center">
        <span className="text-sm text-brand-bg/90 dark:text-brand-text/90">{copyright}</span>
        <span aria-hidden className="text-brand-bg/60 dark:text-brand-text/60">
          •
        </span>
        <FooterTextLink
          href="#top"
          ariaLabel={backToTopLabel}
          variant="legal"
          className="font-semibold"
        >
          {backToTopLabel}
        </FooterTextLink>
      </Cluster>
    </Stack>
  );
});

export default FooterLegalRow;
export { FooterLegalRow };
