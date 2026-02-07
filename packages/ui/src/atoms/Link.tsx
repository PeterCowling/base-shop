"use client";

import React from "react";
import NextLink from "next/link";

export type AnchorLikeProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to?: string;
  href?: string;
  children?: React.ReactNode;
  /** Next.js prefetch hint for internal links */
  prefetch?: boolean | null;
};

/**
 * AppLink — smart link wrapper
 * - Internal links ("/" or relative) render <Link> from next/link
 * - External links render <a>, preserving target/rel
 */
export const AppLink = React.forwardRef<HTMLAnchorElement, AnchorLikeProps>(
  ({ href, to, children, prefetch, ...rest }, ref) => {
    const resolved = (to ?? href ?? "").toString();
    const isExternal =
      resolved.startsWith("http:") ||
      resolved.startsWith("https:") ||
      resolved.startsWith("//") ||
      resolved.startsWith("mailto:") ||
      resolved.startsWith("tel:");

    if (!resolved) return <a ref={ref} {...rest}>{children}</a>;
    if (isExternal) {
      return (
        <a ref={ref} href={resolved} {...rest}>
          {children}
        </a>
      );
    }
    return (
      <NextLink
        ref={ref}
        href={resolved}
        prefetch={prefetch}
        {...rest}
      >
        {children}
      </NextLink>
    );
  }
);

AppLink.displayName = "AppLink";

export { NextLink as Link };

export default AppLink;
