import type { Redis } from "@upstash/redis";

export type Exec = <T>(fn: () => Promise<T>) => Promise<T | undefined>;

export async function withFallback<T>(
  ops: (() => Promise<any | undefined>)[],
  fallback: () => Promise<T>
): Promise<T | undefined> {
  let ok = true;
  for (const op of ops) {
    if ((await op()) === undefined) ok = false;
  }
  if (!ok) {
    return fallback();
  }
  return undefined;
}

export function expireBoth(
  exec: Exec,
  client: Redis,
  id: string,
  ttl: number,
  skuKey: string
): (() => Promise<any | undefined>)[] {
  return [
    () => exec(() => client.expire(id, ttl)),
    () => exec(() => client.expire(skuKey, ttl)),
  ];
}
