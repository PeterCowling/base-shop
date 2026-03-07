import i18n from "@/i18n";

export type AppNamespaceBundles = Record<string, Record<string, unknown>>;

const primedBundleKeys = new Set<string>();

export function primeAppI18nBundles(
  lang: string,
  bundles?: AppNamespaceBundles,
): void {
  if (!bundles) return;

  for (const [namespace, bundle] of Object.entries(bundles)) {
    if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
      continue;
    }

    const cacheKey = `${lang}:${namespace}`;
    if (primedBundleKeys.has(cacheKey) && i18n.hasResourceBundle(lang, namespace)) {
      continue;
    }

    i18n.addResourceBundle(lang, namespace, bundle, true, true);
    primedBundleKeys.add(cacheKey);
  }
}
