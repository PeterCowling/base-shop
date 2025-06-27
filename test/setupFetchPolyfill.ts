// test/setupFetchPolyfill.ts   (new file at repo root)

import fetch, { Headers, Request, Response } from "cross-fetch";

if (!globalThis.fetch) {
  Object.assign(globalThis, { fetch, Headers, Request, Response });
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
