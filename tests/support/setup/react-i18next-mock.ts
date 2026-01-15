// tests/support/setup/react-i18next-mock.ts
// Augment react-i18next mocks so they always expose a withTranslation helper.

import React from "react";
import { vi } from "vitest";

type MockFactory = (...args: any[]) => any;
type MockOptions = unknown;

const DEFAULT_LANG = "en";

const defaultTranslate = (key: string, options?: { defaultValue?: unknown }): string => {
  if (typeof options?.defaultValue === "string" && options.defaultValue.trim().length > 0) {
    return options.defaultValue;
  }
  return key;
};

const defaultI18n = {
  language: DEFAULT_LANG,
  languages: [DEFAULT_LANG] as string[],
  changeLanguage: async (next?: string) => {
    if (typeof next === "string" && next.trim().length > 0) {
      defaultI18n.language = next;
      if (!defaultI18n.languages.includes(next)) {
        defaultI18n.languages = [next, ...defaultI18n.languages];
      }
    }
    return defaultI18n.language;
  },
  getFixedT: () => defaultTranslate,
  t: defaultTranslate,
};

const ensureWithTranslation = <T,>(mod: T): T => {
  if (!mod || (typeof mod !== "object" && typeof mod !== "function")) {
    return mod;
  }

  const namespace = mod as Record<string, unknown>;

  if (typeof namespace.withTranslation === "function") {
    return mod;
  }

  const hocFactory =
    () =>
    <P,>(Component: React.ComponentType<P>) => {
      const WithTranslation = React.forwardRef<any, P>((props, ref) => {
        const typed = props as P & { t?: typeof defaultTranslate; i18n?: typeof defaultI18n };
        const tFn = typeof typed.t === "function" ? typed.t : defaultTranslate;
        const i18n = typed.i18n ?? defaultI18n;

        return React.createElement(Component as React.ComponentType<any>, {
          ...props,
          ref,
          t: tFn,
          i18n,
        });
      });

      WithTranslation.displayName = `WithTranslation(${
        Component.displayName ?? Component.name ?? "Component"
      })`;

      return WithTranslation as unknown as React.ComponentType<P>;
    };

  try {
    Object.defineProperty(namespace, "withTranslation", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: hocFactory,
    });
  } catch {
    (namespace as any).withTranslation = hocFactory;
  }

  return mod;
};

const wrapFactory = (factory: MockFactory): MockFactory => {
  return (...args: unknown[]) => {
    const result = factory(...args);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      return (result as Promise<unknown>).then((resolved) => ensureWithTranslation(resolved));
    }
    return ensureWithTranslation(result);
  };
};

const originalMock = vi.mock.bind(vi) as (...args: any[]) => unknown;

const patchedMock: typeof vi.mock = ((id: unknown, factory?: MockFactory, options?: MockOptions) => {
  if (id === "react-i18next" && typeof factory === "function") {
    return (originalMock as any)(id, wrapFactory(factory), options);
  }
  return (originalMock as any)(id, factory, options);
}) as typeof vi.mock;

Object.assign(patchedMock, originalMock);
(vi as unknown as { mock: typeof vi.mock }).mock = patchedMock;

if (typeof vi.doMock === "function") {
  const originalDoMock = vi.doMock.bind(vi) as (...args: any[]) => unknown;

  const patchedDoMock: typeof vi.doMock = ((id: unknown, factory?: MockFactory, options?: MockOptions) => {
    if (id === "react-i18next" && typeof factory === "function") {
      return (originalDoMock as any)(id, wrapFactory(factory), options);
    }
    return (originalDoMock as any)(id, factory, options);
  }) as typeof vi.doMock;

  Object.assign(patchedDoMock, originalDoMock);
  (vi as unknown as { doMock: typeof vi.doMock }).doMock = patchedDoMock;
}