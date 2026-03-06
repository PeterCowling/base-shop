import assistantApiEn from '../../public/locales/en/AssistantApi.json';
import checkInCodeApiEn from '../../public/locales/en/CheckInCodeApi.json';
import extensionRequestApiEn from '../../public/locales/en/ExtensionRequestApi.json';
import messagingDispatcherEn from '../../public/locales/en/MessagingDispatcher.json';
import assistantApiIt from '../../public/locales/it/AssistantApi.json';
import checkInCodeApiIt from '../../public/locales/it/CheckInCodeApi.json';
import extensionRequestApiIt from '../../public/locales/it/ExtensionRequestApi.json';
import messagingDispatcherIt from '../../public/locales/it/MessagingDispatcher.json';

type TranslationCatalog = Record<string, unknown>;
type TranslationLocale = 'en' | 'it';
type TranslationNamespace =
  | 'AssistantApi'
  | 'CheckInCodeApi'
  | 'ExtensionRequestApi'
  | 'MessagingDispatcher';
type TranslationVars = Record<string, string | number | boolean>;

const DEFAULT_LOCALE: TranslationLocale = 'en';

const TRANSLATION_CATALOGS: Record<
  TranslationLocale,
  Record<TranslationNamespace, TranslationCatalog>
> = {
  en: {
    AssistantApi: assistantApiEn,
    CheckInCodeApi: checkInCodeApiEn,
    ExtensionRequestApi: extensionRequestApiEn,
    MessagingDispatcher: messagingDispatcherEn,
  },
  it: {
    AssistantApi: assistantApiIt,
    CheckInCodeApi: checkInCodeApiIt,
    ExtensionRequestApi: extensionRequestApiIt,
    MessagingDispatcher: messagingDispatcherIt,
  },
};

function maybeResolveLocaleTag(rawLocale: string): TranslationLocale | null {
  const normalizedLocale = rawLocale.trim().toLowerCase();
  if (normalizedLocale === 'en' || normalizedLocale.startsWith('en-')) {
    return 'en';
  }
  if (normalizedLocale === 'it' || normalizedLocale.startsWith('it-')) {
    return 'it';
  }
  return null;
}

function resolveRequestLocale(request: Request): TranslationLocale {
  const acceptLanguage = request.headers.get('Accept-Language') ?? '';
  const rawLocales = acceptLanguage
    .split(',')
    .map((entry) => entry.split(';')[0]?.trim() ?? '')
    .filter((entry) => entry.length > 0);

  for (const rawLocale of rawLocales) {
    const resolvedLocale = maybeResolveLocaleTag(rawLocale);
    if (resolvedLocale) {
      return resolvedLocale;
    }
  }

  return DEFAULT_LOCALE;
}

function resolvePathValue(catalog: TranslationCatalog, path: string): string | null {
  const segments = path.split('.');
  let current: unknown = catalog;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, variableName: string) => {
    if (!(variableName in vars)) {
      return '';
    }
    return String(vars[variableName]);
  });
}

function createTranslator(
  namespace: TranslationNamespace,
  locale: TranslationLocale,
) {
  const localeCatalog = TRANSLATION_CATALOGS[locale][namespace];
  const fallbackCatalog = TRANSLATION_CATALOGS[DEFAULT_LOCALE][namespace];

  return {
    locale,
    t: (path: string, vars?: TranslationVars) => {
      const localeValue = resolvePathValue(localeCatalog, path);
      const fallbackValue = resolvePathValue(fallbackCatalog, path);
      const resolvedTemplate = localeValue ?? fallbackValue ?? path;
      return interpolate(resolvedTemplate, vars);
    },
  };
}

export interface FunctionTranslator {
  locale: TranslationLocale;
  t: (path: string, vars?: TranslationVars) => string;
}

export function createFunctionTranslator(
  request: Request,
  namespace: TranslationNamespace,
): FunctionTranslator {
  return createTranslator(namespace, resolveRequestLocale(request));
}

export function createDefaultFunctionTranslator(
  namespace: TranslationNamespace,
  locale: TranslationLocale = DEFAULT_LOCALE,
): FunctionTranslator {
  return createTranslator(namespace, locale);
}
