// src/components/footer/FooterLinks.tsx
import type { PropsWithChildren } from "react";
import Link from "next/link";
import clsx from "clsx";

import { EXTERNAL_REL } from "./footerConstants";

type FooterLinkVariant = "nav" | "legal";

type FooterTextLinkProps = PropsWithChildren<{
  href: string;
  external?: boolean;
  newTab?: boolean;
  prefetch?: boolean;
  isActive?: boolean;
  variant?: FooterLinkVariant;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}>;

const NAV_BASE_CLASSES = [
  "inline-flex",
  "min-h-[44px]",
  "items-center",
  "gap-2",
  "font-medium",
  "text-brand-bg",
  "underline",
  "decoration-2",
  "underline-offset-[0.2em]",
  "decoration-current",
  "transition-colors",
  "hover:text-brand-secondary",
  "hover:decoration-brand-secondary",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-4",
  "focus-visible:outline-current",
  "dark:text-brand-text",
] as const;

const LEGAL_BASE_CLASSES = [
  "inline-flex",
  "min-h-[44px]",
  "items-center",
  "text-sm",
  "font-medium",
  "text-brand-bg",
  "no-underline",
  "transition-colors",
  "hover:underline",
  "decoration-2",
  "underline-offset-[0.2em]",
  "decoration-current",
  "hover:text-brand-secondary",
  "hover:decoration-brand-secondary",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-4",
  "focus-visible:outline-current",
  "dark:text-brand-text",
] as const;

const ICON_LINK_CLASSES = [
  "inline-flex",
  "size-11",
  "items-center",
  "justify-center",
  "rounded-full",
  "text-brand-bg",
  "transition-colors",
  "hover:text-brand-secondary",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-4",
  "focus-visible:outline-current",
  "dark:text-brand-text",
] as const;

function shouldUseAnchor(href: string, external?: boolean): boolean {
  if (external) return true;
  return href.startsWith("mailto:") || href.startsWith("#");
}

function footerTextLinkClassName({
  variant,
  size,
  isActive,
  className,
}: {
  variant: FooterLinkVariant;
  size: "sm" | "md";
  isActive?: boolean;
  className?: string;
}): string {
  const sizeClass = size === "sm" ? "text-sm" : "text-base";
  const base = variant === "legal" ? LEGAL_BASE_CLASSES : NAV_BASE_CLASSES;
  return clsx(base, variant === "nav" ? sizeClass : null, isActive ? "font-semibold" : null, className);
}

export function FooterTextLink({
  href,
  external,
  newTab,
  prefetch,
  isActive,
  variant = "nav",
  size = "md",
  className,
  ariaLabel,
  children,
}: FooterTextLinkProps): JSX.Element {
  const isAnchor = shouldUseAnchor(href, external);
  const rel = newTab ? EXTERNAL_REL : undefined;
  const target = newTab ? "_blank" : undefined;
  const classNames = footerTextLinkClassName({ variant, size, isActive, className });
  const ariaCurrent = isActive ? "page" : undefined;

  if (isAnchor) {
    return (
      <a href={href} className={classNames} target={target} rel={rel} aria-current={ariaCurrent} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={prefetch} className={classNames} aria-current={ariaCurrent} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

type FooterIconLinkProps = PropsWithChildren<{
  href: string;
  external?: boolean;
  newTab?: boolean;
  className?: string;
  ariaLabel?: string;
}>;

export function FooterIconLink({
  href,
  external,
  newTab,
  className,
  ariaLabel,
  children,
}: FooterIconLinkProps): JSX.Element {
  const isAnchor = shouldUseAnchor(href, external);
  const rel = newTab ? EXTERNAL_REL : undefined;
  const target = newTab ? "_blank" : undefined;
  const classNames = clsx(ICON_LINK_CLASSES, className);

  if (isAnchor) {
    return (
      <a href={href} className={classNames} target={target} rel={rel} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classNames} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
