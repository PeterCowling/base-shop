// Mock for packages/ui/src/context/modal/environment.ts in Jest tests
// The real module uses import.meta which Jest CJS mode can't parse

const globalRef: Record<string, unknown> & {
  window?: { location?: { href: string } };
  document?: unknown;
} = globalThis as unknown as Record<string, unknown> & {
  window?: { location?: { href: string } };
  document?: unknown;
};

if (typeof globalRef.window === "undefined") {
  globalRef.window = { location: { href: "" } };
}

const ensureDocument = (): Document | undefined =>
  typeof document !== "undefined" ? document : undefined;

const setWindowLocationHref = (nextHref: string): void => {
  const location = globalRef.window?.location;
  if (location) {
    location.href = nextHref;
  }
};

const setTestRuntimeForTests = (_value: boolean | undefined): void => {
  // no-op in test mock
};

export { ensureDocument, globalRef, setTestRuntimeForTests, setWindowLocationHref };
