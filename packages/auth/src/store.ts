import { coreEnv } from "@acme/config/env/core";

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // one week
export const SESSION_TTL_S = Math.floor(SESSION_TTL_MS / 1000);

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

let customFactory: SessionStoreFactory | null = null;

export function setSessionStoreFactory(factory: SessionStoreFactory) {
  customFactory = factory;
}

export async function createSessionStore(): Promise<SessionStore> {
  if (customFactory) {
    return customFactory();
  }

  const storeType = coreEnv.SESSION_STORE;

  if (
    storeType === "redis" ||
    (!storeType &&
      coreEnv.UPSTASH_REDIS_REST_URL &&
      coreEnv.UPSTASH_REDIS_REST_TOKEN)
  ) {
    try {
      const { Redis } = await import("@upstash/redis"); // i18n-exempt: module specifier; not user-facing copy
      const { RedisSessionStore } = await import("./redisStore");
      const client = new Redis({
        url: coreEnv.UPSTASH_REDIS_REST_URL!,
        token: coreEnv.UPSTASH_REDIS_REST_TOKEN!,
      });
      return new RedisSessionStore(client, SESSION_TTL_S);
    } catch (error) {
      console.error(
        "Failed to initialize Redis session store", // i18n-exempt: internal diagnostic log; not user-facing
        error,
      );
    }
  }

  const { MemorySessionStore } = await import("./memoryStore");
  return new MemorySessionStore(SESSION_TTL_S);
}
