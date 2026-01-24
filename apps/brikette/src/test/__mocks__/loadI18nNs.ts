// Mock for @/utils/loadI18nNs in Jest tests
// The real module uses import.meta.url which Jest CJS mode can't parse

export async function loadI18nNs(_lang: string, _ns: string): Promise<void> {
  // no-op in tests
}

export async function preloadI18nNamespaces(
  _lang: string,
  _namespaces: string[],
): Promise<void> {
  // no-op in tests
}

export async function preloadNamespacesWithFallback(
  _lang: string,
  _namespaces: string[],
  _options?: { preload?: (lang: string, ns: string[], opts: { optional: boolean }) => Promise<void> },
): Promise<void> {
  // no-op in tests
}
