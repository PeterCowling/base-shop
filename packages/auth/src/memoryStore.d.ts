import type { SessionRecord, SessionStore } from "./store.js";

export declare class MemorySessionStore implements SessionStore {
    private ttl;
    private sessions;
    constructor(ttl: number);
    get(id: string): Promise<SessionRecord | null>;
    set(record: SessionRecord): Promise<void>;
    delete(id: string): Promise<void>;
    list(customerId: string): Promise<SessionRecord[]>;
}
//# sourceMappingURL=memoryStore.d.ts.map