import type { SessionRecord, SessionStore } from "./store";
interface DurableObjectNamespace {
    idFromName(name: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
}
interface DurableObjectId {
    toString(): string;
}
interface DurableObjectStub {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
interface DurableObjectStorage {
    get<T>(key: string): Promise<T | undefined>;
    put<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<boolean>;
    list<T>(opts?: {
        prefix?: string;
    }): Promise<Map<string, T>>;
}
interface DurableObjectState {
    storage: DurableObjectStorage;
}
/** Cloudflare Durable Object-backed implementation of SessionStore */
export declare class CloudflareDurableObjectSessionStore implements SessionStore {
    private namespace;
    private ttl;
    constructor(namespace: DurableObjectNamespace, ttl: number);
    private stub;
    private call;
    get(id: string): Promise<SessionRecord | null>;
    set(record: SessionRecord): Promise<void>;
    delete(id: string): Promise<void>;
    list(customerId: string): Promise<SessionRecord[]>;
}
/** Durable Object implementation (bind as SESSION_DO) */
export declare class SessionDurableObject {
    private state;
    constructor(state: DurableObjectState);
    private sessionKey;
    private customerKey;
    private load;
    private save;
    private deleteSession;
    fetch(request: Request): Promise<Response>;
}
export {};
