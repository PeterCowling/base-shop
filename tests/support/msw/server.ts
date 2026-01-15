import { http, HttpResponse, type HttpHandler } from "msw";
import { setupServer } from "msw/node";
import handlers from "./handlers";

export const mswServer = setupServer(...handlers);

type RestMethod = "get" | "post" | "put" | "patch" | "delete";

type MockJsonOptions = {
  status?: number;
  headers?: Record<string, string>;
  delayMs?: number;
};

async function maybeDelay(delayMs?: number) {
  if (!delayMs || delayMs <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

export function mockJson(
  method: RestMethod,
  url: string | RegExp,
  body: unknown,
  options: MockJsonOptions = {},
): HttpHandler {
  const status = options.status ?? 200;
  const headers = options.headers;
  return http[method](url, async () => {
    await maybeDelay(options.delayMs);
    return HttpResponse.json(body as any, { status, headers });
  });
}

export function passthrough(method: RestMethod, url: string | RegExp): HttpHandler {
  return http[method](url, async ({ request }) => {
    const result = await fetch(request);
    return new HttpResponse(await result.text(), {
      status: result.status,
      headers: Object.fromEntries(result.headers.entries()),
    });
  });
}

export function mockStatus(method: RestMethod, url: string | RegExp, status: number): HttpHandler {
  return http[method](url, () => HttpResponse.json({}, { status }));
}

export function useHandlers(...customHandlers: HttpHandler[]) {
  mswServer.use(...customHandlers);
}