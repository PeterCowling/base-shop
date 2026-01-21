import type { Redis } from "@upstash/redis";

export type Exec = <T>(fn: () => Promise<T>) => Promise<T | undefined>;
export type AsyncOp = () => Promise<unknown | undefined>;
export declare function withFallback<T>(ops: AsyncOp[], fallback: () => Promise<T>): Promise<T | undefined>;
export declare function expireBoth(exec: Exec, client: Redis, id: string, ttl: number, skuKey: string): AsyncOp[];
export declare function skuKey(id: string): string;
export declare function serialize<T>(value: T | undefined | null): string | undefined;
export declare function deserialize<T>(value: string | undefined | null): T | undefined;
