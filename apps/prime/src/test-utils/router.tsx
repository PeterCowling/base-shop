import React, {
  type ComponentPropsWithoutRef,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type UrlLike = {
  pathname?: string;
  search?: string;
};

export type To = string | UrlLike;
export type NavigateOptions = { replace?: boolean };

type LocationState = {
  pathname: string;
  search: string;
  hash: string;
  state: null;
  key: string;
};

type RouterContextValue = {
  location: LocationState;
  navigate: (to: To | number, options?: NavigateOptions) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

function parseLocation(href: string): LocationState {
  const url = new URL(href, 'http://localhost');
  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    state: null,
    key: `${url.pathname}${url.search}${url.hash}`,
  };
}

function buildHref(to: To): string {
  if (typeof to === 'string') return to;
  const pathname = to.pathname ?? '/';
  const search = to.search ?? '';
  if (!search) return pathname;
  return search.startsWith('?') ? `${pathname}${search}` : `${pathname}?${search}`;
}

function normalizePath(pathname: string): string {
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function matchPath(pattern: string, pathname: string): boolean {
  if (pattern === '*') return true;
  const normalizedPattern = normalizePath(pattern);
  const normalizedPathname = normalizePath(pathname);
  if (normalizedPattern === normalizedPathname) return true;

  const patternSegments = normalizedPattern.split('/').filter(Boolean);
  const pathSegments = normalizedPathname.split('/').filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return false;

  return patternSegments.every((segment, index) => {
    if (segment.startsWith(':')) return true;
    return segment === pathSegments[index];
  });
}

export type LinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  to?: To;
  href?: string;
  children?: ReactNode;
};

export function Link({ to, href, onClick, ...props }: LinkProps) {
  const navigate = useNavigate();
  const resolved = href ?? (to ? buildHref(to) : '');
  return (
    <a
      href={resolved}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || props.target) return;
        event.preventDefault();
        navigate(to ?? resolved);
      }}
      {...props}
    />
  );
}

export function useNavigate() {
  const context = useContext(RouterContext);
  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (context) {
        context.navigate(to, options);
        return;
      }
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      const href = buildHref(to);
      if (options?.replace) {
        window.history.replaceState({}, '', href);
      } else {
        window.history.pushState({}, '', href);
      }
    },
    [context],
  );
}

export function useLocation() {
  const context = useContext(RouterContext);
  if (context) return context.location;
  return parseLocation(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | string | Record<string, string>, options?: NavigateOptions) => void,
] {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const setSearchParams = useCallback(
    (
      next: URLSearchParams | string | Record<string, string>,
      options?: NavigateOptions,
    ) => {
      let nextString = '';
      if (typeof next === 'string') {
        nextString = next.startsWith('?') ? next.slice(1) : next;
      } else if (next instanceof URLSearchParams) {
        nextString = next.toString();
      } else {
        nextString = new URLSearchParams(next).toString();
      }
      const search = nextString ? `?${nextString}` : '';
      navigate({ pathname: location.pathname, search }, options);
    },
    [location.pathname, navigate],
  );

  return [params, setSearchParams];
}

export function useParams<T extends Record<string, string | string[]>>() {
  return {} as T;
}

export function Navigate({ to, replace = false }: { to: To; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);
  return null;
}

export function MemoryRouter({
  initialEntries = ['/'],
  children,
}: {
  initialEntries?: string[];
  children: ReactNode;
}) {
  const [location, setLocation] = useState<LocationState>(() => {
    const entry = initialEntries[0] ?? '/';
    const next = parseLocation(entry);
    window.history.replaceState({}, '', `${next.pathname}${next.search}${next.hash}`);
    return next;
  });

  const navigate = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === 'number') {
        window.history.go(to);
        return;
      }
      const href = buildHref(to);
      if (options?.replace) {
        window.history.replaceState({}, '', href);
      } else {
        window.history.pushState({}, '', href);
      }
      setLocation(parseLocation(href));
    },
    [],
  );

  const value = useMemo(() => ({ location, navigate }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

type RouteProps = {
  path?: string;
  element?: ReactNode;
  index?: boolean;
};

export function Routes({ children }: { children: ReactNode }) {
  const location = useLocation();
  let match: React.ReactElement<RouteProps> | null = null;

  React.Children.forEach(children, (child) => {
    if (match) return;
    if (!React.isValidElement<RouteProps>(child)) return;
    const path = child.props.path;
    const isIndex = Boolean(child.props.index);
    if (isIndex && location.pathname === '/') {
      match = child;
      return;
    }
    if (path && matchPath(path, location.pathname)) {
      match = child;
    }
  });

  return match ? <>{match.props.element}</> : null;
}

export function Route(_: RouteProps) {
  return null;
}

export function Outlet({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}