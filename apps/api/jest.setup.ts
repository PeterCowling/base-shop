import {
  fetch as undiciFetch,
  Response as UndiciResponse,
  Request as UndiciRequest,
  Headers as UndiciHeaders,
} from "undici";

const globalAny = globalThis as typeof globalThis & Record<string, unknown>;

if (typeof globalAny.fetch !== "function") {
  globalAny.fetch = undiciFetch;
}

if (typeof globalAny.Response !== "function") {
  globalAny.Response = UndiciResponse;
}

if (typeof globalAny.Request !== "function") {
  globalAny.Request = UndiciRequest;
}

if (typeof globalAny.Headers !== "function") {
  globalAny.Headers = UndiciHeaders;
}

const ResponseCtor = globalAny.Response as typeof UndiciResponse;

if (typeof (ResponseCtor as any).json !== "function") {
  (ResponseCtor as any).json = (data: unknown, init?: ResponseInit) =>
    new ResponseCtor(JSON.stringify(data), init);
}
