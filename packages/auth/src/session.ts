// packages/auth/src/session.ts
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "node:crypto";
import type { Role } from "./types";
import type { SessionRecord } from "./store";
import { createSessionStore, SESSION_TTL_S } from "./store";
import { env } from "@acme/config";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const CSRF_TOKEN_COOKIE = "csrf_token";

export interface CustomerSession {
  customerId: string;
  role: Role;
}

interface InternalSession extends CustomerSession {
  sessionId: string;
}

const sessionStorePromise = createSessionStore();

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
