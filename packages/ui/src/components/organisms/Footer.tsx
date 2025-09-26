import * as React from "react";
import { cn } from "../../utils/style";
import type { LogoVariants } from "./types";
import useViewport from "../../hooks/useViewport";
import { Logo } from "../atoms";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  links?: FooterLink[];
  logoVariants?: LogoVariants;
  shopName: string;
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, links = [], logoVariants, shopName, ...props }, ref) => {
    const viewport = useViewport();
    const logo = logoVariants?.[viewport];
    return (
      <footer
        ref={ref}
        data-token="--color-bg"
        className={cn("flex h-14 items-center justify-between border-t px-4", className)}
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
        <nav className="ms-auto flex gap-4 text-sm">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:underline" data-token="--color-fg">
              {l.label}
            </a>
          ))}
        </nav>
      </footer>
    );
  },
);
Footer.displayName = "Footer";
