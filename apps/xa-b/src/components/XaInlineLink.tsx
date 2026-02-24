import type { AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@acme/design-system/utils/style";

type XaInlineLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel" | "title">;

const baseClassName = "underline min-h-11 min-w-11";

export function XaInlineLink({
  href,
  children,
  className,
  target,
  rel,
  title,
}: XaInlineLinkProps) {
  const mergedClassName = cn(baseClassName, className);
  const isInternal = href.startsWith("/") || href.startsWith("#");

  if (isInternal) {
    return (
      <Link href={href} className={mergedClassName} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={mergedClassName} target={target} rel={rel} title={title}>
      {children}
    </a>
  );
}
