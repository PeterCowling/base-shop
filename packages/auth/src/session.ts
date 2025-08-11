// packages/auth/src/session.ts
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "node:crypto";
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

const activeSessions = new Map<string, SessionRecord>();

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

function csrfCookieOptions() {
  return {
    httpOnly: false,
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
  if (!activeSessions.has(session.sessionId)) {
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
  activeSessions.set(session.sessionId, {
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
  activeSessions.delete(oldId);
  const { customerId, role } = session;
  return { customerId, role };
}

export async function createCustomerSession(sessionData: CustomerSession): Promise<void> {
  const secret = process.env.SESSION_SECRET;
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
  activeSessions.set(session.sessionId, {
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
    const secret = process.env.SESSION_SECRET;
    if (secret) {
      try {
        const session = await unsealData<InternalSession>(token, {
          password: secret,
          ttl: SESSION_TTL_S,
        });
        activeSessions.delete(session.sessionId);
      } catch {}
    }
  }
  store.delete(CUSTOMER_SESSION_COOKIE, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  });
  store.delete(CSRF_TOKEN_COOKIE, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  });
}

export function listSessions(customerId: string): SessionRecord[] {
  return Array.from(activeSessions.values()).filter(
    (s) => s.customerId === customerId
  );
}

export function revokeSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}

export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const store = await cookies();
  const cookie = store.get(CSRF_TOKEN_COOKIE)?.value;
  return token === cookie;
}
