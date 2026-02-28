/**
 * Global automatic mock for react-i18next.
 *
 * Used by tests that render components using useTranslation() without
 * providing their own jest.mock('react-i18next', ...) override.
 *
 * Loads all EN locale files from public/locales/en/ so that t() returns
 * real translated strings instead of raw keys.
 *
 * Tests that call jest.mock('react-i18next', factory) will override this.
 */
import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.resolve(__dirname, '../public/locales/en');

function flattenObj(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(result, flattenObj(v as Record<string, unknown>, full));
    } else {
      result[full] = String(v ?? '');
    }
  }
  return result;
}

/** Lazily-loaded per-namespace lookup tables */
const namespaceCache: Record<string, Record<string, string>> = {};

function getNamespace(ns: string): Record<string, string> {
  if (!namespaceCache[ns]) {
    const file = path.join(localesDir, `${ns}.json`);
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
      namespaceCache[ns] = flattenObj(raw);
    } else {
      namespaceCache[ns] = {};
    }
  }
  return namespaceCache[ns];
}

function makeTFunction(ns: string | string[]) {
  const namespaces = Array.isArray(ns) ? ns : [ns];
  return (key: string, opts?: Record<string, unknown>): string => {
    for (const namespace of namespaces) {
      const lookup = getNamespace(namespace);
      // Try namespace-qualified key first, then bare key
      const bare = key.includes(':') ? key.split(':')[1] : key;
      const value = lookup[bare] ?? lookup[key];
      if (value !== undefined) {
        if (opts) {
          return Object.entries(opts).reduce<string>(
            (acc, [k, v]) => acc.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
            value,
          );
        }
        return value;
      }
    }
    return key;
  };
}

const DEFAULT_NS = 'Homepage';

export function useTranslation(ns?: string | string[]) {
  const namespace = ns ?? DEFAULT_NS;
  const t = makeTFunction(namespace);
  return {
    t,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
      exists: jest.fn(() => true),
    },
    ready: true,
  };
}

export const initReactI18next = {
  type: '3rdParty' as const,
  init: jest.fn(),
};

export const Trans = ({ children }: { children: React.ReactNode }) => children;

export default { useTranslation, initReactI18next, Trans };
