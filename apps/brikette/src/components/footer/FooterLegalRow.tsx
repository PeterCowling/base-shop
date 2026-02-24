// src/components/footer/FooterLegalRow.tsx
import { memo } from "react";

import { Cluster, Stack } from "@/components/ui/flex";

import { FooterTextLink } from "./FooterLinks";
import type { FooterLink } from "./footerTypes";

function BackToTopButton({ label }: { label: string }): JSX.Element {
  return (
    <a
      href="#top"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-bg transition-colors hover:text-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current dark:text-brand-text dark:hover:text-brand-secondary"
    >
      <svg
        aria-hidden="true"
        className="size-4"
        viewBox="0 0 20 20"
        fill="currentColor"
        focusable="false"
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </a>
  );
}

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
      <Cluster className="items-center gap-4">
        <span className="text-sm text-brand-bg/90 dark:text-brand-text/90">{copyright}</span>
        <BackToTopButton label={backToTopLabel} />
      </Cluster>
    </Stack>
  );
});

export default FooterLegalRow;
export { FooterLegalRow };
