import { vi } from "vitest";

type ReactRouterDomExports = typeof import("../src/compat/react-router-dom");

const createReactRouterDomMock = async (): Promise<ReactRouterDomExports> => {
  const actual = (await import("../src/compat/react-router-dom")) as ReactRouterDomExports;
  const memoryRouter =
    actual.MemoryRouter ?? actual.default?.MemoryRouter ?? (() => null);
  const baseDefault = actual.default ?? {};

  return {
    __esModule: true,
    ...actual,
    MemoryRouter: memoryRouter,
    default: {
      ...baseDefault,
      MemoryRouter: memoryRouter,
    },
  };
};

vi.mock("react-router", async () => await import("../src/compat/react-router"));
vi.mock("react-router-dom", async () => await createReactRouterDomMock());
vi.mock("react-router/dom", async () => await createReactRouterDomMock());

await import("@tests/setup");

type RouterLike = {
  basePath: string;
  pathname: string;
  route: string;
  asPath: string;
  query: Record<string, string | string[] | undefined>;
  push: (url: string) => Promise<boolean>;
  replace: (url: string) => Promise<boolean>;
  reload: () => void;
  back: () => void;
  prefetch: (url: string) => Promise<void>;
  beforePopState: (cb: unknown) => void;
  events: { on: (evt: string, cb: unknown) => void; off: (evt: string, cb: unknown) => void; emit: (evt: string) => void };
  isFallback: boolean;
  isReady: boolean;
  isLocaleDomain: boolean;
  isPreview: boolean;
};

const createRouter = (): RouterLike => ({
  basePath: "",
  pathname: "/",
  route: "/",
  asPath: "/",
  query: {},
  push: vi.fn(async () => true),
  replace: vi.fn(async () => true),
  reload: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn(async () => {}),
  beforePopState: vi.fn(),
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
  isFallback: false,
  isReady: true,
  isLocaleDomain: false,
  isPreview: false,
});

let router = createRouter();

(globalThis as any).__NEXT_ROUTER_MOCK__ = {
  get: () => router,
  set: (partial: Partial<RouterLike>) => {
    router = { ...router, ...partial };
  },
  reset: () => {
    router = createRouter();
  },
};

// Ensure per-test isolation.
afterEach(() => {
  try {
    (globalThis as any).__NEXT_ROUTER_MOCK__?.reset?.();
  } catch {}
});

vi.mock("next/router", () => ({
  useRouter: () => (globalThis as any).__NEXT_ROUTER_MOCK__.get(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => (globalThis as any).__NEXT_ROUTER_MOCK__.get().pathname,
  useSearchParams: () => new URLSearchParams((globalThis as any).__NEXT_ROUTER_MOCK__.get().asPath.split("?")[1] ?? ""),
  useRouter: () => ({
    push: (href: string) => (globalThis as any).__NEXT_ROUTER_MOCK__.get().push(href),
    replace: (href: string) => (globalThis as any).__NEXT_ROUTER_MOCK__.get().replace(href),
    back: () => (globalThis as any).__NEXT_ROUTER_MOCK__.get().back(),
    prefetch: (href: string) => (globalThis as any).__NEXT_ROUTER_MOCK__.get().prefetch(href),
  }),
}));
