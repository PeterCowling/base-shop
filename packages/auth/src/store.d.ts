export declare const SESSION_TTL_MS: number;
export declare const SESSION_TTL_S: number;
export interface SessionRecord {
    sessionId: string;
    customerId: string;
    userAgent: string;
    createdAt: Date;
}
export interface SessionStore {
    get(id: string): Promise<SessionRecord | null>;
    set(record: SessionRecord): Promise<void>;
    delete(id: string): Promise<void>;
    list(customerId: string): Promise<SessionRecord[]>;
}
export type SessionStoreFactory = () => Promise<SessionStore>;
export declare function setSessionStoreFactory(factory: SessionStoreFactory): void;
export declare function createSessionStore(): Promise<SessionStore>;
//# sourceMappingURL=store.d.ts.map