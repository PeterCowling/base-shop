// src/components/footer/FooterNav.tsx
import { memo } from "react";
import Link from "next/link";

import { Grid } from "@acme/ui/atoms";

import { EXTERNAL_REL } from "./footerConstants";
import type { FooterGroup } from "./footerTypes";

type FooterNavProps = {
  navGroups: FooterGroup[];
  linkClasses: (small?: boolean, isActive?: boolean) => string;
  isActiveLink: (href: string) => boolean;
  prefetch?: boolean;
};

const FooterNav = memo(function FooterNav({
  navGroups,
  linkClasses,
  isActiveLink,
  prefetch,
}: FooterNavProps): JSX.Element {
  return (
    <nav aria-label="Footer navigation">
      <Grid columns={{ base: 1, sm: 2, lg: 3 }} gap={6}>
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
                    {link.external ? (
                    <a
                      href={link.href}
                      target={link.newTab ? "_blank" : undefined}
                      rel={link.newTab ? EXTERNAL_REL : undefined}
                      className={linkClasses(true)}
                    >
                      {link.label}
                    </a>
                    ) : (
                      <Link
                        href={link.href}
                        prefetch={prefetch}
                        aria-current={isActive ? "page" : undefined}
                        className={linkClasses(true, isActive)}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Grid>
    </nav>
  );
});

export default FooterNav;
export { FooterNav };
