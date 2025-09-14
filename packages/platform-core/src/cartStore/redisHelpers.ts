import type { Redis } from "@upstash/redis";

export type Exec = <T>(fn: () => Promise<T>) => Promise<T | undefined>;

export type AsyncOp = () => Promise<unknown | undefined>;

export async function withFallback<T>(
  ops: AsyncOp[],
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
): AsyncOp[] {
  return [
    () => exec(() => client.expire(id, ttl)),
    () => exec(() => client.expire(skuKey, ttl)),
  ];
}

export function skuKey(id: string): string {
  return `${id}:sku`;
}

export function serialize<T>(value: T | undefined | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.stringify(value);
}

export function deserialize<T>(value: string | undefined | null): T | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(value) as T;
}
