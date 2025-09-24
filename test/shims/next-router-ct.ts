// Minimal shim for next/router in Cypress Component Testing
// Allows component specs to control router query/params without Next runtime.

export type NextRouterStub = {
  query: Record<string, string | string[]>;
  pathname?: string;
  asPath?: string;
  push?: (..._args: unknown[]) => Promise<void> | void;
  replace?: (..._args: unknown[]) => Promise<void> | void;
  prefetch?: (..._args: unknown[]) => Promise<void> | void;
  back?: () => void;
};

let state: NextRouterStub = { query: {} };

export function useRouter(): NextRouterStub {
  return state;
}

export function __setNextRouter(next: Partial<NextRouterStub>) {
  state = { ...state, ...next } as NextRouterStub;
}

