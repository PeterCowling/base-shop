import React, { forwardRef, useCallback, useContext, useMemo, useState } from "react";
import NextLink from "next/link";

import {
  ClientLoaderFunctionArgs,
  LoaderFunctionArgs,
  NavigateFunction,
  NavigateOptions,
  RouterState,
  RouterStateContext,
  RouteDataContext,
  RouterStateProvider,
  To,
  Location,
  fallbackNavigate,
  getFallbackLocation,
  locationFromUrl,
  redirect,
  toHref,
} from "./router-state";

export type { ClientLoaderFunctionArgs, LoaderFunctionArgs, NavigateFunction, NavigateOptions, To, Location };
export { redirect };

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className"> & {
  to: To;
  replace?: boolean;
  prefetch?: "intent" | "viewport" | "render" | "none" | boolean;
  className?: string;
  preventScrollReset?: boolean;
};

const normalizePrefetch = (value: LinkProps["prefetch"]): boolean | undefined => {
  if (value === undefined) return undefined;
  if (value === false || value === "none") return false;
  return true;
};

const omitUndefined = <T extends Record<string, unknown>>(input: T): Partial<T> => {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as Partial<T>;
};

export const useInRouterContext = (): boolean => Boolean(useContext(RouterStateContext));

export const useLocation = (): Location => {
  const state = useContext(RouterStateContext);
  return state?.location ?? getFallbackLocation();
};

export const useParams = (): Record<string, string | undefined> => {
  const state = useContext(RouterStateContext);
  return state?.params ?? {};
};

export const useNavigate = (): NavigateFunction => {
  const state = useContext(RouterStateContext);
  return useCallback<NavigateFunction>(
    (to, options) => {
      if (state?.navigate) {
        state.navigate(to, options);
        return;
      }
      fallbackNavigate(to, options);
    },
    [state],
  );
};

export const useSearchParams = (): [
  URLSearchParams,
  (next: URLSearchParams | string | Record<string, string>, options?: NavigateOptions) => void,
] => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search ?? ""), [location.search]);

  const setSearchParams = useCallback(
    (next: URLSearchParams | string | Record<string, string>, options?: NavigateOptions) => {
      const nextParams =
        typeof next === "string"
          ? new URLSearchParams(next)
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next);
      const search = nextParams.toString();
      const href = toHref({
        pathname: location.pathname,
        search: search ? `?${search}` : "",
        hash: location.hash,
      });
      navigate(href, options);
    },
    [location.hash, location.pathname, navigate],
  );

  return [params, setSearchParams];
};

export const useLoaderData = <T = unknown>(): T => {
  const ctx = useContext(RouteDataContext);
  return ctx?.data as T;
};

export const useOutlet = (): React.ReactNode => {
  const ctx = useContext(RouteDataContext);
  return ctx?.outlet ?? null;
};

export const Outlet = (): React.ReactElement | null => {
  const outlet = useOutlet();
  return outlet ? <>{outlet}</> : null;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace, prefetch, className, children, preventScrollReset, ...rest }, ref) => {
    const href = toHref(to);
    const inRouter = useInRouterContext();
    if (!inRouter) {
      return (
        <a ref={ref} href={href} className={className} {...rest}>
          {children}
        </a>
      );
    }

    const cleanedRest = omitUndefined(rest as Record<string, unknown>);
    const nextLinkProps = cleanedRest as unknown as Omit<
      React.ComponentProps<typeof NextLink>,
      "href" | "className"
    >;

    return (
      <NextLink
        href={href}
        {...(preventScrollReset ? { scroll: false } : {})}
        {...(replace !== undefined ? { replace } : {})}
        {...(() => {
          const normalized = normalizePrefetch(prefetch);
          return normalized !== undefined ? { prefetch: normalized } : {};
        })()}
        {...(className !== undefined ? { className } : {})}
        {...nextLinkProps}
        ref={ref}
      >
        {children}
      </NextLink>
    );
  },
);
Link.displayName = "CompatLink";

export type NavLinkProps = Omit<LinkProps, "className"> & {
  end?: boolean;
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
};

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end = false, className, ...rest }, ref) => {
    const location = useLocation();
    const href = toHref(to);
    const targetPath = href.split(/[?#]/)[0] || "/";
    const isActive = end
      ? location.pathname === targetPath
      : location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
    const resolvedClassName =
      typeof className === "function" ? className({ isActive, isPending: false }) : className;

    const linkProps = {
      ...(resolvedClassName !== undefined ? { className: resolvedClassName } : {}),
      ...rest,
    };

    return (
      <Link
        ref={ref}
        to={to}
        aria-current={isActive ? "page" : undefined}
        {...linkProps}
      />
    );
  },
);
NavLink.displayName = "CompatNavLink";

export const PrefetchPageLinks = ({ page }: { page: string }): null => {
  void page;
  return null;
};

export const HydratedRouter = ({ children }: { children?: React.ReactNode }): React.ReactElement => (
  <>{children ?? null}</>
);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const normalizeEntries = (entries: string[] | undefined) => {
  const normalized = entries && entries.length ? entries : ["/"];
  return normalized.map((entry) => locationFromUrl(entry || "/", "http://localhost"));
};

type MemoryRouterProps = {
  children?: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
};

export const MemoryRouter = ({ children, initialEntries, initialIndex = 0 }: MemoryRouterProps): React.ReactElement => {
  const [history, setHistory] = useState(() => {
    const entries = normalizeEntries(initialEntries);
    return {
      entries,
      index: clamp(initialIndex, 0, entries.length - 1),
    };
  });

  // We know location exists because normalizeEntries always returns at least "/"
  // and index is clamped to valid range
  const location = history.entries[history.index]!;

  const navigate = useCallback<NavigateFunction>((to, options) => {
    setHistory((prev) => {
      if (typeof to === "number") {
        return { ...prev, index: clamp(prev.index + to, 0, prev.entries.length - 1) };
      }

      const href = toHref(to);
      const nextLocation = locationFromUrl(href, "http://localhost");

      if (options?.replace) {
        const entries = [...prev.entries];
        entries[prev.index] = nextLocation;
        return { entries, index: prev.index };
      }

      const entries = [...prev.entries.slice(0, prev.index + 1), nextLocation];
      return { entries, index: prev.index + 1 };
    });
  }, []);

  const state = useMemo<RouterState>(
    () => ({
      location,
      params: {},
      matches: [],
      loaderData: {},
      navigate,
    }),
    [location, navigate],
  );

  return <RouterStateProvider state={state}>{children ?? null}</RouterStateProvider>;
};

export const Routes = ({ children }: { children?: React.ReactNode }): React.ReactElement | null => (
  <>{children ?? null}</>
);

export const Route = ({
  children,
  element,
}: {
  children?: React.ReactNode;
  element?: React.ReactElement | null;
}): React.ReactElement | null => {
  if (element) return <>{element}</>;
  if (children) return <>{children}</>;
  return null;
};

const routerDom = {
  Link,
  NavLink,
  PrefetchPageLinks,
  HydratedRouter,
  MemoryRouter,
  Outlet,
  useInRouterContext,
  useLocation,
  useNavigate,
  useOutlet,
  useParams,
  useSearchParams,
  useLoaderData,
  redirect,
  Routes,
  Route,
};

export default routerDom;
