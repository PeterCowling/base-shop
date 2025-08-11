// packages/auth/src/session.ts
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "node:crypto";
import { env } from "@acme/config";
import type { Role } from "./types";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const CSRF_TOKEN_COOKIE = "csrf_token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // one week
const SESSION_TTL_S = Math.floor(SESSION_TTL_MS / 1000);

export interface CustomerSession {
  customerId: string;
  role: Role;
}

interface InternalSession extends CustomerSession {
  sessionId: string;
}

interface SessionRecord {
  sessionId: string;
  customerId: string;
  userAgent: string;
  createdAt: Date;
}

interface SessionStore {
  get(id: string): Promise<SessionRecord | null>;
  set(record: SessionRecord): Promise<void>;
  delete(id: string): Promise<void>;
  list(customerId: string): Promise<SessionRecord[]>;
}

class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, { record: SessionRecord; expires: number }>();

  constructor(private ttl: number) {}

  async get(id: string): Promise<SessionRecord | null> {
    const entry = this.sessions.get(id);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return entry.record;
  }

  async set(record: SessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, {
      record,
      expires: Date.now() + this.ttl * 1000,
    });
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const now = Date.now();
    return Array.from(this.sessions.values())
      .filter((s) => s.expires > now && s.record.customerId === customerId)
      .map((s) => s.record);
  }
}

class RedisSessionStore implements SessionStore {
  constructor(private client: Redis, private ttl: number) {}

  private key(id: string) {
    return `session:${id}`;
  }

  private customerKey(customerId: string) {
    return `customer_sessions:${customerId}`;
  }

  async get(id: string): Promise<SessionRecord | null> {
    const data = await this.client.get<Record<string, any>>(this.key(id));
    if (!data) return null;
    return { ...data, createdAt: new Date(data.createdAt) } as SessionRecord;
  }

  async set(record: SessionRecord): Promise<void> {
    await this.client.set(this.key(record.sessionId), record, { ex: this.ttl });
    await this.client.sadd(this.customerKey(record.customerId), record.sessionId);
    await this.client.expire(this.customerKey(record.customerId), this.ttl);
  }

  async delete(id: string): Promise<void> {
    const rec = await this.get(id);
    await this.client.del(this.key(id));
    if (rec) {
      await this.client.srem(this.customerKey(rec.customerId), id);
    }
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const ids = await this.client.smembers<string>(
      this.customerKey(customerId)
    );
    if (!ids || ids.length === 0) return [];
    const records = await this.client.mget<Record<string, any>>(
      ...ids.map((id) => this.key(id))
    );
    return records
      .filter((r): r is Record<string, any> => r !== null)
      .map((r) => ({ ...r, createdAt: new Date(r.createdAt) } as SessionRecord));
  }
}

const sessionStorePromise: Promise<SessionStore> = (async () => {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import("@upstash/redis");
    const client = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    return new RedisSessionStore(client, SESSION_TTL_S);
  }
  return new MemorySessionStore(SESSION_TTL_S);
})();

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_S,
    domain: env.COOKIE_DOMAIN,
  };
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "strict" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_S,
    domain: env.COOKIE_DOMAIN,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const secret = env.SESSION_SECRET;
  if (!secret) return null;
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  let session: InternalSession;
  try {
    session = await unsealData<InternalSession>(token, {
      password: secret,
      ttl: SESSION_TTL_S,
    });
  } catch {
    return null;
  }
  const sessionStore = await sessionStorePromise;
  const exists = await sessionStore.get(session.sessionId);
  if (!exists) {
    return null;
  }
  // rotate on activity
  const oldId = session.sessionId;
  session.sessionId = randomUUID();
  const newToken = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  store.set(CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
  if (!store.get(CSRF_TOKEN_COOKIE)) {
    const csrf = randomUUID();
    store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
  }
  const ua = headers().get("user-agent") ?? "unknown";
  await sessionStore.set({
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
  await sessionStore.delete(oldId);
  const { customerId, role } = session;
  return { customerId, role };
}

export async function createCustomerSession(sessionData: CustomerSession): Promise<void> {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  const store = await cookies();
  const session: InternalSession = {
    ...sessionData,
    sessionId: randomUUID(),
  };
  const token = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  store.set(CUSTOMER_SESSION_COOKIE, token, cookieOptions());
  const csrf = randomUUID();
  store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
  const ua = headers().get("user-agent") ?? "unknown";
  const sessionStore = await sessionStorePromise;
  await sessionStore.set({
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) {
    const secret = env.SESSION_SECRET;
    if (secret) {
      try {
        const session = await unsealData<InternalSession>(token, {
          password: secret,
          ttl: SESSION_TTL_S,
        });
        const sessionStore = await sessionStorePromise;
        await sessionStore.delete(session.sessionId);
      } catch {}
    }
  }
  store.delete(CUSTOMER_SESSION_COOKIE, {
    path: "/",
    domain: env.COOKIE_DOMAIN,
  });
  store.delete(CSRF_TOKEN_COOKIE, {
    path: "/",
    domain: env.COOKIE_DOMAIN,
  });
}

export async function listSessions(
  customerId: string
): Promise<SessionRecord[]> {
  const sessionStore = await sessionStorePromise;
  return sessionStore.list(customerId);
}

export async function revokeSession(sessionId: string): Promise<void> {
  const sessionStore = await sessionStorePromise;
  await sessionStore.delete(sessionId);
}

export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const store = await cookies();
  const cookie = store.get(CSRF_TOKEN_COOKIE)?.value;
  return token === cookie;
}
