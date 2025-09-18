// test/setupFetchPolyfill.ts   (new file at repo root)

type CrossFetchModule = typeof import("cross-fetch");

const crossFetch = require("cross-fetch") as CrossFetchModule & {
  default?: typeof globalThis.fetch;
  fetch?: typeof globalThis.fetch;
};

const fetch: typeof globalThis.fetch =
  crossFetch.default ??
  crossFetch.fetch ??
  (crossFetch as unknown as typeof globalThis.fetch);
const { Headers, Request, Response } = crossFetch;
const { webcrypto } = require("node:crypto") as typeof import("node:crypto");
const React = require("react") as typeof import("react");

const mutableEnv = process.env as Record<string, string>;
mutableEnv.EMAIL_FROM ||= "test@example.com";

if (!globalThis.fetch) {
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}

// Ensure a cryptographically secure PRNG for libraries like `ulid`
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
    value: webcrypto,
  });
}
// JSDOM exposes a `window` object separate from `globalThis`.  Libraries like
// `ulid` look for `window.crypto`, so mirror the polyfill there as well.
if (typeof window !== "undefined" && !(window as any).crypto) {
  Object.defineProperty(window, "crypto", {
    value: webcrypto,
  });
}

// Node's test environment may lack FormData, so provide a minimal polyfill
if (!("FormData" in globalThis)) {
  class SimpleFormData {
    private map = new Map<string, any[]>();

    append(name: string, value: any) {
      const arr = this.map.get(name) || [];
      arr.push(value);
      this.map.set(name, arr);
    }

    set(name: string, value: any) {
      this.map.set(name, [value]);
    }

    get(name: string): any | null {
      const arr = this.map.get(name);
      return arr ? arr[0] : null;
    }

    getAll(name: string): any[] {
      return this.map.get(name) ?? [];
    }

    *entries(): IterableIterator<[string, any]> {
      for (const [key, values] of this.map.entries()) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }

    [Symbol.iterator](): IterableIterator<[string, any]> {
      return this.entries();
    }
  }

  (globalThis as any).FormData = SimpleFormData;
}

if (!("getAll" in Headers.prototype)) {
  (Headers.prototype as any).getAll = function (
    this: Headers,
    name: string
  ): string[] {
    const value = this.get(name);
    return value ? [value] : [];
  };
}

// React 19 renamed some internal fields used by react-dom. Jest loads test
// modules before `setupFilesAfterEnv`, so ensure both the old and new
// properties exist on the React instance that `react-dom` will import.
if (
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE &&
  !(React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
) {
  (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
} else if (
  (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED &&
  !(React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
) {
  (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =
    (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
}

// The experimental React builds used in this repo may not provide `act`.
// Testing libraries rely on it, so polyfill a minimal thenable version.
if (!(React as any).act) {
  (React as any).act = (callback: () => void | Promise<void>) => {
    const result = callback();
    return result && typeof (result as any).then === "function"
      ? result
      : Promise.resolve(result);
  };
}

