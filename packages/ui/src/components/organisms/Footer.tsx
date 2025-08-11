import * as React from "react";
import { cn } from "../../utils/style";

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  links?: FooterLink[];
  logo?: string;
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>(
  ({ className, links = [], logo, ...props }, ref) => (
    <footer
      ref={ref}
      data-token="--color-bg"
      className={cn("flex h-14 items-center justify-between border-t px-4", className)}
      {...props}
    >
      {logo && (
        <span className="font-bold" data-token="--color-fg">
          {logo}
        </span>
      )}
      <nav className="ml-auto flex gap-4 text-sm">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="hover:underline" data-token="--color-fg">
            {l.label}
          </a>
        ))}
      </nav>
    </footer>
  )
);
Footer.displayName = "Footer";
