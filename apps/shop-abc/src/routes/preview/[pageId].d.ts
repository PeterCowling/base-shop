import type { EventContext } from "@cloudflare/workers-types";
export declare const onRequest: ({ params, request, }: EventContext<unknown, string, Record<string, unknown>>) => Promise<Response>;
