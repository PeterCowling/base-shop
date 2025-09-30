export function usePathname(): string {
  try {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  } catch {
    return '/';
  }
}

export function useRouter() {
  return {
    push: (_: string) => {},
    replace: (_: string) => {},
    prefetch: async (_: string) => {},
    back: () => {},
    forward: () => {},
  } as const;
}

export function useSearchParams() {
  try {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    return {
      get: (k: string) => params.get(k),
      toString: () => params.toString(),
    } as const;
  } catch {
    return { get: () => null, toString: () => '' } as const;
  }
}

