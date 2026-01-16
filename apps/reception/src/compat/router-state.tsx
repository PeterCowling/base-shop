import React, { createContext, useMemo } from "react";

export type Location = {
  pathname: string;
  search: string;
  hash: string;
  state?: unknown;
  key?: string;
};

export type To = string | Partial<Pick<Location, "pathname" | "search" | "hash">>;

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type NavigateFunction = (to: To | number, options?: NavigateOptions) => void;

export type RedirectResult = {
  __redirect: true;
  location: string;
  status: number;
  headers: Headers;
};

export type RouteMatch = {
  id?: string;
  pathname?: string;
  params?: Record<string, string | undefined>;
  data?: unknown;
  handle?: unknown;
  route?: { id?: string; handle?: unknown };
};

export type LoaderFunctionArgs = {
  request: Request;
  params: Record<string, string | undefined>;
  context?: unknown;
};

export type ClientLoaderFunctionArgs = LoaderFunctionArgs & {
  serverLoader?: unknown;
};

export type LoaderFunction = (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
export type ClientLoaderFunction = (args: ClientLoaderFunctionArgs) => unknown | Promise<unknown>;

export type RouterState = {
  location: Location;
  params: Record<string, string | undefined>;
  matches: RouteMatch[];
  loaderData: Record<string, unknown>;
  outlet?: React.ReactNode;
  navigate?: NavigateFunction;
};

type NavigationContextValue = {
  navigator?: {
    push?: NavigateFunction;
    replace?: NavigateFunction;
    navigate?: NavigateFunction;
    go?: (delta: number) => void;
  };
  location?: Location;
};

type DataRouterState = {
  location: Location;
  matches: RouteMatch[];
  loaderData: Record<string, unknown>;
};

export const RouterStateContext = createContext<RouterState | null>(null);
export const RouteDataContext = createContext<{
  id?: string;
  data?: unknown;
  outlet?: React.ReactNode;
} | null>(null);
export const DataRouterStateContext = createContext<DataRouterState | null>(null);
export const NavigationContext = createContext<NavigationContextValue | null>(null);

export const locationFromUrl = (href: string, base = "http://localhost"): Location => {
  try {
    const url = new URL(href, base);
    return { pathname: url.pathname, search: url.search, hash: url.hash, state: null, key: "default" };
  } catch {
    return { pathname: href || "/", search: "", hash: "", state: null, key: "default" };
  }
};

export const getFallbackLocation = (): Location => {
  if (typeof window !== "undefined" && window.location) {
    return {
      pathname: window.location.pathname || "/",
      search: window.location.search || "",
      hash: window.location.hash || "",
      state: null,
      key: "window",
    };
  }

  return { pathname: "/", search: "", hash: "", state: null, key: "fallback" };
};

export const toHref = (to: To): string => {
  if (typeof to === "string") return to;
  const pathname = to.pathname ?? "";
  const search = to.search ?? "";
  const hash = to.hash ?? "";
  const normalizedSearch = search && !search.startsWith("?") ? `?${search}` : search;
  const normalizedHash = hash && !hash.startsWith("#") ? `#${hash}` : hash;
  const href = `${pathname}${normalizedSearch}${normalizedHash}`;
  return href || "/";
};

export const fallbackNavigate: NavigateFunction = (to, options) => {
  if (typeof window === "undefined") return;

  if (typeof to === "number") {
    window.history?.go?.(to);
    return;
  }

  const href = toHref(to);
  if (!href) return;

  if (options?.replace) {
    window.location.replace(href);
    return;
  }

  window.location.assign(href);
};

export const redirect = (
  location: string,
  init?: { status?: number; headers?: HeadersInit },
): RedirectResult => {
  const headers = new Headers(init?.headers);
  headers.set("Location", location);
  return {
    __redirect: true,
    location,
    status: init?.status ?? 302,
    headers,
  };
};

export const isRedirectResult = (value: unknown): value is RedirectResult =>
  Boolean(
    value &&
      typeof value === "object" &&
      "__redirect" in value &&
      (value as RedirectResult).__redirect === true,
  );

export const RouterStateProvider = ({
  state,
  children,
}: {
  state: RouterState;
  children: React.ReactNode;
}): React.ReactElement => {
  const navigate = state.navigate ?? fallbackNavigate;
  const navigationValue = useMemo<NavigationContextValue>(
    () => ({
      location: state.location,
      navigator: {
        push: (to, options) => navigate(to, { ...options, replace: false }),
        replace: (to, options) => navigate(to, { ...options, replace: true }),
        navigate: (to, options) => navigate(to, options),
        go: (delta) => navigate(delta),
      },
    }),
    [navigate, state.location],
  );

  const dataRouterValue = useMemo<DataRouterState>(
    () => ({
      location: state.location,
      matches: state.matches,
      loaderData: state.loaderData,
    }),
    [state.location, state.matches, state.loaderData],
  );

  return (
    <RouterStateContext.Provider value={state}>
      <DataRouterStateContext.Provider value={dataRouterValue}>
        <NavigationContext.Provider value={navigationValue}>
          {children}
        </NavigationContext.Provider>
      </DataRouterStateContext.Provider>
    </RouterStateContext.Provider>
  );
};
