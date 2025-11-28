import React, { createContext, useContext } from 'react';

export type RouterStubState = {
  pathname: string;
  searchParams: URLSearchParams;
  params?: Record<string, string>;
  push: (url: string) => void;
  replace: (url: string) => void;
  back: () => void;
  refresh: () => void;
  prefetch: (url: string) => Promise<void>;
};

const RouterContext = createContext<RouterStubState>({
  pathname: '/',
  searchParams: new URLSearchParams(''),
  params: {},
  push: () => {},
  replace: () => {},
  back: () => {},
  refresh: () => {},
  prefetch: async () => {},
});

export function RouterStubProvider({ value, children }: { value: RouterStubState; children: React.ReactNode }) {
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  return {
    push: ctx.push,
    replace: ctx.replace,
    back: ctx.back,
    refresh: ctx.refresh,
    prefetch: ctx.prefetch,
  };
}

export function usePathname() {
  return useContext(RouterContext).pathname;
}

export function useSearchParams(): URLSearchParams {
  return useContext(RouterContext).searchParams;
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useContext(RouterContext).params as T;
}

export function notFound(): never {
  throw new Error('next/navigation notFound() called (stub)');
}

export function redirect(_url: string): never {
  throw new Error('next/navigation redirect() called (stub)');
}
