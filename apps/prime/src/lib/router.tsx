'use client';

/**
 * Router utilities - Next.js wrapper for navigation
 * Provides a unified API compatible with both client and server components
 */

import { type ComponentProps,forwardRef } from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter as useNextRouter, useSearchParams } from 'next/navigation';

// Extended props to support react-router style `to` prop
type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href?: ComponentProps<typeof NextLink>['href'];
  to?: string | { pathname: string; search?: string };
};

/**
 * Link component that supports both Next.js `href` and react-router `to` props
 * for easier migration from react-router
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  function Link({ to, href, ...props }, ref) {
    // Convert react-router style `to` prop to Next.js `href`
    let finalHref: ComponentProps<typeof NextLink>['href'];

    if (to !== undefined) {
      if (typeof to === 'string') {
        finalHref = to;
      } else {
        // Handle object form: { pathname: string, search?: string }
        finalHref = to.search ? `${to.pathname}${to.search}` : to.pathname;
      }
    } else {
      finalHref = href ?? '/';
    }

    return <NextLink ref={ref} href={finalHref} {...props} />;
  }
);

/**
 * useNavigate - programmatic navigation hook
 * Compatible API with react-router's useNavigate
 */
export function useNavigate() {
  const router = useNextRouter();

  return function navigate(
    to: string | { pathname: string; search?: string },
    options?: { replace?: boolean }
  ) {
    let path: string;
    if (typeof to === 'string') {
      path = to;
    } else {
      path = to.search ? `${to.pathname}${to.search}` : to.pathname;
    }

    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

/**
 * useLocation - current location hook
 * Returns pathname and search params
 */
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return {
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
    searchParams,
  };
}

// Re-export for convenience
export { usePathname, useSearchParams };
