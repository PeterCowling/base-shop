/* eslint-disable import/no-anonymous-default-export, no-console */
/**
 * Thin Worker entry wrapper that extends the OpenNext-generated worker
 * with a `scheduled` handler for Cloudflare cron triggers.
 *
 * - Re-exports all named exports from OpenNext (Durable Object classes)
 * - Delegates `fetch` to the OpenNext handler unchanged
 * - Adds `scheduled` handler that invokes the recovery API route
 *   by calling the OpenNext handler directly (not global fetch)
 *
 * This file is NOT part of the Next.js/tsc build (excluded from tsconfig).
 * It is compiled by wrangler at deploy time.
 */

// @ts-ignore: OpenNext generated file, resolved at wrangler build time
import openNextWorker from "./.open-next/worker.js";

// Re-export all named exports (Durable Object classes)
// @ts-ignore: OpenNext generated file
export { DOQueueHandler } from "./.open-next/worker.js";
// @ts-ignore: OpenNext generated file
export { DOShardedTagCache } from "./.open-next/worker.js";
// @ts-ignore: OpenNext generated file
export { BucketCachePurge } from "./.open-next/worker.js";

type Env = {
  INBOX_RECOVERY_SECRET?: string;
  [key: string]: unknown;
};

type ExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

type ScheduledEvent = {
  scheduledTime: number;
  cron: string;
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const secret = env.INBOX_RECOVERY_SECRET;
    if (!secret) {
      console.warn("INBOX_RECOVERY_SECRET not set, skipping scheduled recovery");
      return;
    }

    const request = new Request(
      "https://internal/api/internal/inbox-recovery",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      },
    );

    const responsePromise = openNextWorker.fetch(request, env, ctx)
      .then((response: Response) => {
        if (!response.ok) {
          console.error("Scheduled inbox recovery failed", {
            status: response.status,
            cron: event.cron,
          });
        } else {
          console.info("Scheduled inbox recovery completed", {
            status: response.status,
            cron: event.cron,
          });
        }
      })
      .catch((error: unknown) => {
        console.error("Scheduled inbox recovery error", {
          error: error instanceof Error ? error.message : String(error),
          cron: event.cron,
        });
      });

    ctx.waitUntil(responsePromise);
  },
};
