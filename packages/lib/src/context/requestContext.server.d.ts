import "server-only";
import type { RequestContext } from "./types";
export type { EnvLabel, RequestContext } from "./types";
export declare function getRequestContext(): RequestContext | undefined;
export declare function setRequestContext(ctx: RequestContext | undefined): void;
export declare function withRequestContext<T>(ctx: RequestContext, fn: () => T): T;
//# sourceMappingURL=requestContext.server.d.ts.map