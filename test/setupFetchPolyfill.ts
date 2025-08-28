// test/setupFetchPolyfill.ts   (new file at repo root)

import fetch, { Headers, Request, Response } from "cross-fetch";
import { webcrypto } from "node:crypto";

if (!globalThis.fetch) {
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}

// Ensure a cryptographically secure PRNG for libraries like `ulid`
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, "crypto", {
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
