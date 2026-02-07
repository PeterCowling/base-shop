// Mock for @/i18n in Jest tests
// The real module uses import.meta.url which Jest CJS mode can't parse

const i18n = {
  language: "en",
  languages: ["en"],
  options: {
    fallbackLng: ["en"],
    supportedLngs: ["en", "de", "es", "fr", "it", "pt", "ru", "zh", "ja", "ko"],
  },
  t: (key: string, opts?: Record<string, unknown>) => {
    if (opts && typeof opts.defaultValue === "string") return opts.defaultValue;
    return key;
  },
  exists: () => false,
  getFixedT: (lng: string, ns?: string) => {
    const t = (key: string, opts?: Record<string, unknown>) => {
      if (opts?.returnObjects) return undefined;
      if (opts && typeof opts.defaultValue === "string") return opts.defaultValue;
      return key;
    };
    return t;
  },
  getResource: () => undefined,
  hasResourceBundle: () => false,
  addResourceBundle: () => {},
  changeLanguage: async (lng: string) => {
    i18n.language = lng;
  },
  use: () => i18n,
  init: () => Promise.resolve(i18n),
  on: () => {},
  off: () => {},
  emit: () => {},
  loadNamespaces: () => Promise.resolve(),
  reloadResources: () => Promise.resolve(),
  isInitialized: true,
};

export default i18n;
