// apps/cms/src/lib/deployQueue.ts
// Minimal in-memory deploy queue with retry/backoff to avoid concurrent deploys
// per shop and provide basic resilience.

type DeployJob<T> = () => Promise<T>;

interface EnqueueOptions {
  maxRetries?: number;
  backoffMs?: number;
}

const queues = new Map<string, Promise<unknown>>();

export async function enqueueDeploy<T>(
  shopId: string,
  job: DeployJob<T>,
  options: EnqueueOptions = {},
): Promise<{ ok: boolean; result?: T; error?: string; attempts: number }> {
  const maxRetries = options.maxRetries ?? 2;
  const backoffMs = options.backoffMs ?? 2000;

  let attempts = 0;
  const run = async () => {
    while (attempts <= maxRetries) {
      attempts += 1;
      try {
        const result = await job();
        return { ok: true, result, attempts };
      } catch (err) {
        if (attempts > maxRetries) {
          const message =
            err && typeof err === "object" && "message" in err
              ? String((err as { message?: unknown }).message)
              : "deploy failed";
          return { ok: false, error: message, attempts };
        }
        await new Promise((resolve) => setTimeout(resolve, backoffMs * attempts));
      }
    }
    return { ok: false, error: "deploy failed", attempts };
  };

  const prev = queues.get(shopId) ?? Promise.resolve();
  const next = prev.then(run, run);
  queues.set(shopId, next);
  const result = await next;
  if (queues.get(shopId) === next) {
    queues.delete(shopId);
  }
  return result;
}
