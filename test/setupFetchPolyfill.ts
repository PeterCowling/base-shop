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
    private map = new Map<string, string[]>();

    append(name: string, value: any) {
      const arr = this.map.get(name) || [];
      arr.push(String(value));
      this.map.set(name, arr);
    }

    set(name: string, value: any) {
      this.map.set(name, [String(value)]);
    }

    get(name: string): string | null {
      const arr = this.map.get(name);
      return arr ? arr[0] : null;
    }

    getAll(name: string): string[] {
      return this.map.get(name) ?? [];
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
