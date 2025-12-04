export type EnvLabel = "dev" | "stage" | "prod";

export interface RequestContext {
  requestId: string;
  operationId?: string;
  shopId?: string;
  env: EnvLabel;
  service: string;
}

let currentContext: RequestContext | undefined;

export function getRequestContext(): RequestContext | undefined {
  return currentContext;
}

export function setRequestContext(ctx: RequestContext | undefined): void {
  currentContext = ctx;
}

export function withRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  const previous = currentContext;
  currentContext = ctx;
  try {
    return fn();
  } finally {
    currentContext = previous;
  }
}

