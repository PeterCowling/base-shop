import React from "react";
import { Link as RouterLink } from "react-router-dom";

export type AnchorLikeProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to?: string;
  href?: string;
  children?: React.ReactNode;
  /** React Router prefetch hint for internal links */
  prefetch?: React.ComponentProps<typeof RouterLink>["prefetch"];
};

/**
 * AppLink — smart link wrapper
 * - Internal links ("/" or relative) render <Link> from react-router-dom
 * - External links render <a>, preserving target/rel
 */
type RouterLinkProps = React.ComponentProps<typeof RouterLink> & {
  prefetch?: AnchorLikeProps["prefetch"];
};

export const AppLink: React.FC<AnchorLikeProps> = ({ href, to, children, prefetch, ...rest }) => {
  const resolved = (to ?? href ?? "").toString();
  const isExternal =
    resolved.startsWith("http:") ||
    resolved.startsWith("https:") ||
    resolved.startsWith("//") ||
    resolved.startsWith("mailto:") ||
    resolved.startsWith("tel:");

  if (!resolved) return <a {...rest}>{children}</a>;
  if (isExternal) {
    return (
      <a href={resolved} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink
      to={resolved}
      {...(prefetch !== undefined ? { prefetch } : {})}
      {...(rest as Omit<RouterLinkProps, "to">)}
    >
      {children}
    </RouterLink>
  );
};

export { RouterLink as Link };

export default AppLink;
