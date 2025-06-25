// test/setupFetchPolyfill.ts   (new file at repo root)

import fetch, { Headers, Request, Response } from "cross-fetch";

if (!globalThis.fetch) {
  Object.assign(globalThis, { fetch, Headers, Request, Response });
}
