// packages/auth/src/session.ts
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "node:crypto";
import type { Role } from "./types";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
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
  has(id: string): Promise<boolean>;
  set(record: SessionRecord): Promise<void>;
  delete(id: string): Promise<void>;
  list(customerId: string): Promise<SessionRecord[]>;
}

class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionRecord>();

  async has(id: string): Promise<boolean> {
    return this.sessions.has(id);
  }

  async set(record: SessionRecord): Promise<void> {
    this.sessions.set(record.sessionId, record);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    return Array.from(this.sessions.values()).filter(
      (s) => s.customerId === customerId,
    );
  }
}

class RedisSessionStore implements SessionStore {
  constructor(private client: any) {}

  private key(id: string) {
    return `session:${id}`;
  }

  private customerKey(customerId: string) {
    return `sessions:${customerId}`;
  }

  async has(id: string): Promise<boolean> {
    return (await this.client.exists(this.key(id))) === 1;
  }

  async set(record: SessionRecord): Promise<void> {
    await this.client.set(
      this.key(record.sessionId),
      JSON.stringify({
        customerId: record.customerId,
        userAgent: record.userAgent,
        createdAt: record.createdAt.toISOString(),
      }),
      { ex: SESSION_TTL_S },
    );
    await this.client.sadd(this.customerKey(record.customerId), record.sessionId);
    await this.client.expire(this.customerKey(record.customerId), SESSION_TTL_S);
  }

  async delete(id: string): Promise<void> {
    const key = this.key(id);
    const raw = await this.client.get<string | null>(key);
    await this.client.del(key);
    if (raw) {
      try {
        const data = JSON.parse(raw) as { customerId: string };
        await this.client.srem(this.customerKey(data.customerId), id);
      } catch {}
    }
  }

  async list(customerId: string): Promise<SessionRecord[]> {
    const ids = await this.client.smembers<string>(this.customerKey(customerId));
    const sessions: SessionRecord[] = [];
    for (const id of ids) {
      const raw = await this.client.get<string | null>(this.key(id));
      if (!raw) continue;
      try {
        const data = JSON.parse(raw) as {
          customerId: string;
          userAgent: string;
          createdAt: string;
        };
        sessions.push({
          sessionId: id,
          customerId: data.customerId,
          userAgent: data.userAgent,
          createdAt: new Date(data.createdAt),
        });
      } catch {}
    }
    return sessions;
  }
}

let sessionStore: SessionStore | null = null;
async function getSessionStore(): Promise<SessionStore> {
  if (sessionStore) return sessionStore;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const { Redis } = await import("@upstash/redis");
    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    sessionStore = new RedisSessionStore(client);
  } else {
    sessionStore = new MemorySessionStore();
  }
  return sessionStore;
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_TTL_S,
    domain: process.env.COOKIE_DOMAIN,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
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
  const store = await getSessionStore();
  if (!(await store.has(session.sessionId))) {
    return null;
  }
  // rotate on activity
  const oldId = session.sessionId;
  session.sessionId = randomUUID();
  const newToken = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  cookieStore.set(CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
  const ua = headers().get("user-agent") ?? "unknown";
  await store.set({
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
  await store.delete(oldId);
  const { customerId, role } = session;
  return { customerId, role };
}

export async function createCustomerSession(
  sessionData: CustomerSession,
): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  const cookieStore = await cookies();
  const session: InternalSession = {
    ...sessionData,
    sessionId: randomUUID(),
  };
  const token = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  cookieStore.set(CUSTOMER_SESSION_COOKIE, token, cookieOptions());
  const ua = headers().get("user-agent") ?? "unknown";
  const store = await getSessionStore();
  await store.set({
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) {
    const secret = process.env.SESSION_SECRET;
    if (secret) {
      try {
        const session = await unsealData<InternalSession>(token, {
          password: secret,
          ttl: SESSION_TTL_S,
        });
        const store = await getSessionStore();
        await store.delete(session.sessionId);
      } catch {}
    }
  }
  cookieStore.delete(CUSTOMER_SESSION_COOKIE, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  });
}

export const listSessions = async (customerId: string) => {
  const store = await getSessionStore();
  return store.list(customerId);
};

export const revokeSession = async (sessionId: string) => {
  const store = await getSessionStore();
  return store.delete(sessionId);
};

