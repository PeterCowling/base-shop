// src/components/footer/FooterLegalRow.tsx
import { memo } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Cluster, Stack } from "@/components/ui/flex";
import { EXTERNAL_REL } from "./footerConstants";
import type { FooterLink } from "./footerTypes";

type FooterLegalRowProps = {
  legalLinks: FooterLink[];
  legalLinkClasses: (isActive?: boolean) => string;
  isActiveLink: (href: string) => boolean;
  prefetch?: LinkProps["prefetch"];
  copyright: string;
  backToTopLabel: string;
};

const FooterLegalRow = memo(function FooterLegalRow({
  legalLinks,
  legalLinkClasses,
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
              {link.external ? (
                <a
                  href={link.href}
                  target={link.newTab ? "_blank" : undefined}
                  rel={link.newTab ? EXTERNAL_REL : undefined}
                  className={legalLinkClasses()}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  to={link.href}
                  {...(prefetch !== undefined ? { prefetch } : {})}
                  aria-current={isActive ? "page" : undefined}
                  className={legalLinkClasses(isActive)}
                >
                  {link.label}
                </Link>
              )}
            </li>
          );
        })}
      </Cluster>
      <Cluster className="items-center">
        <span className="text-sm text-brand-bg/90 dark:text-brand-text/90">{copyright}</span>
        <span aria-hidden className="text-brand-bg/60 dark:text-brand-text/60">
          •
        </span>
        <a
          href="#top"
          aria-label={backToTopLabel}
          className={`${legalLinkClasses()} font-semibold`}
        >
          {backToTopLabel}
        </a>
      </Cluster>
    </Stack>
  );
});

export default FooterLegalRow;
export { FooterLegalRow };
