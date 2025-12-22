import "server-only";

import { errorResponse } from "@/routes/api/_lib/response";
import type { PipelineEnv } from "@/routes/api/_lib/db";
import type { PipelineEventContext } from "@/routes/api/_lib/types";

type Params = Record<string, string>;

export async function withPipelineContext<ParamShape extends Params>(
  request: Request,
  params: ParamShape,
  handler: (context: PipelineEventContext<PipelineEnv, ParamShape>) => Promise<Response>,
): Promise<Response> {
  const context = getOptionalRequestContext();
  if (!context?.env) {
    return errorResponse(500, "missing_env" /* i18n-exempt -- PP-1100 server error code [ttl=2026-06-30] */, {
      hint: "Cloudflare request context unavailable" /* i18n-exempt -- PP-1100 server error hint [ttl=2026-06-30] */,
    });
  }

  const eventContext = {
    request,
    env: context.env as PipelineEnv,
    params,
  } as unknown as PipelineEventContext<PipelineEnv, ParamShape>;

  return handler(eventContext);
}

function getOptionalRequestContext(): { env?: PipelineEnv } | undefined {
  const contextSymbol = Symbol.for("__cloudflare-request-context__");
  const globalWithContext = globalThis as {
    [key: symbol]: unknown;
  };
  return globalWithContext[contextSymbol] as { env?: PipelineEnv } | undefined;
}
