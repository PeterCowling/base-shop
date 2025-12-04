import * as React from "react";
import { cn } from "../../utils/style";
import type { LogoVariants } from "./types";
import useViewport from "../../hooks/useViewport";
import { Logo } from "../atoms";
import { Inline } from "../atoms/primitives/Inline";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  links?: FooterLink[];
  logoVariants?: LogoVariants;
  shopName: string;
  socialLinks?: FooterLink[];
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, links = [], logoVariants, shopName, socialLinks = [], ...props }, ref) => {
    const viewport = useViewport();
    const logo = logoVariants?.[viewport];
    // i18n-exempt -- DS-1234 [ttl=2025-11-30]
    const footerBaseClass = "flex h-14 items-center justify-between border-t px-4";
    return (
      <footer
        ref={ref}
        data-token="--color-bg"
        className={cn(footerBaseClass, className)}
        {...props}
      >
        <Logo
          src={logo?.src}
          width={logo?.width}
          height={logo?.height}
          alt={shopName}
          fallbackText={shopName}
          className="font-bold"
        />
        {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
        <nav className="ms-auto text-sm">
          {/* Implicit navigation landmark is sufficient here */}
          <div>
          <Inline gap={4}>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                className="inline-flex min-h-11 min-w-11 items-center hover:underline"
                data-token="--color-fg"
              >
                {l.label}
              </a>
            ))}
            {socialLinks.map((s) => (
              <a
                key={s.href}
                href={s.href}
                // i18n-exempt -- DS-1234 [ttl=2025-11-30]
                className="inline-flex min-h-11 min-w-11 items-center hover:underline"
                data-token="--color-fg"
              >
                {s.label}
              </a>
            ))}
          </Inline>
          </div>
        </nav>
      </footer>
    );
  },
);
Footer.displayName = "Footer";

// Provide default export for Storybook/interop expectations.
export default Footer;
