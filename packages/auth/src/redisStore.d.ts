import type { Redis } from "@upstash/redis";

import type { SessionRecord, SessionStore } from "./store.js";

export declare class RedisSessionStore implements SessionStore {
    private client;
    private ttl;
    constructor(client: Redis, ttl: number);
    private key;
    private customerKey;
    get(id: string): Promise<SessionRecord | null>;
    set(record: SessionRecord): Promise<void>;
    delete(id: string): Promise<void>;
    list(customerId: string): Promise<SessionRecord[]>;
}
//# sourceMappingURL=redisStore.d.ts.map