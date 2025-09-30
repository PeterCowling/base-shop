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
const { TransformStream, ReadableStream } = require("node:stream/web") as typeof import("node:stream/web");

const mutableEnv = process.env as Record<string, string>;
mutableEnv.EMAIL_FROM ||= "test@example.com";

if (!globalThis.fetch) {
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}

if (!("TransformStream" in globalThis)) {
  Object.defineProperty(globalThis, "TransformStream", {
    configurable: true,
    enumerable: false,
    value: TransformStream,
    writable: true,
  });
}

if (!("ReadableStream" in globalThis)) {
  Object.defineProperty(globalThis, "ReadableStream", {
    configurable: true,
    enumerable: false,
    value: ReadableStream,
    writable: true,
  });
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

// Shared React/Next polyfills (act, internals alias, MessageChannel, Response.json)
// Import AFTER fetch/Response are available so Response.json shim can attach.
// eslint-disable-next-line import/no-relative-packages
import "./polyfills/react-compat";
