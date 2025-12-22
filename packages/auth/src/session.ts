// packages/auth/src/session.ts
import "server-only";
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "crypto";
import { coreEnv } from "@acme/config/env/core";
import type { Role } from "./types/index";
import type { SessionRecord } from "./store";
import { createSessionStore, SESSION_TTL_S } from "./store";

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

interface CreateSessionOptions {
  remember?: boolean;
}

const REMEMBER_ME_TTL_S = 60 * 60 * 24 * 30;

const isSecureEnv = process.env.NODE_ENV !== "development";

function cookieOptions(maxAge = SESSION_TTL_S) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureEnv,
    path: "/",
    maxAge,
  };
}

function csrfCookieOptions(maxAge = SESSION_TTL_S) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: isSecureEnv,
    path: "/",
    maxAge,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const secret = coreEnv.SESSION_SECRET;
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
  if (
    exists.createdAt &&
    Date.now() - new Date(exists.createdAt).getTime() > SESSION_TTL_S * 1000
  ) {
    await sessionStore.delete(session.sessionId);
    return null;
  }
  // rotate on activity
  const oldId = session.sessionId;
  session.sessionId = randomUUID();
  const newToken = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  const ua = (await headers()).get("user-agent") ?? "unknown";
  await sessionStore.set({
    sessionId: session.sessionId,
    customerId: session.customerId,
    userAgent: ua,
    createdAt: new Date(),
  });
  await sessionStore.delete(oldId);
  store.set(CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
  if (!store.get(CSRF_TOKEN_COOKIE)) {
    const csrf = randomUUID();
    store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
  }
  const { customerId, role } = session;
  return { customerId, role };
}

export async function createCustomerSession(
  sessionData: CustomerSession,
  options: CreateSessionOptions = {},
): Promise<void> {
  const secret = coreEnv.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set in core environment configuration", // i18n-exempt: internal configuration error message; not user-facing
    );
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
  const maxAge = options.remember ? REMEMBER_ME_TTL_S : SESSION_TTL_S;
  store.set(CUSTOMER_SESSION_COOKIE, token, cookieOptions(maxAge));
  const csrf = randomUUID();
  store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions(maxAge));
  const ua = (await headers()).get("user-agent") ?? "unknown";
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
  let error: unknown;
  if (token) {
    const secret = coreEnv.SESSION_SECRET;
    if (secret) {
      try {
        const session = await unsealData<InternalSession>(token, {
          password: secret,
          ttl: SESSION_TTL_S,
        });
        if (session.sessionId) {
          const sessionStore = await sessionStorePromise;
          try {
            await sessionStore.delete(session.sessionId);
          } catch (err) {
            error = err;
          }
        }
      } catch {
        // ignore invalid tokens
      }
    }
  }
  store.delete({
    name: CUSTOMER_SESSION_COOKIE,
    path: "/",
  });
  store.delete({
    name: CSRF_TOKEN_COOKIE,
    path: "/",
  });
  if (coreEnv.COOKIE_DOMAIN) {
    store.delete({
      name: CUSTOMER_SESSION_COOKIE,
      path: "/",
      domain: coreEnv.COOKIE_DOMAIN,
    });
    store.delete({
      name: CSRF_TOKEN_COOKIE,
      path: "/",
      domain: coreEnv.COOKIE_DOMAIN,
    });
  }
  if (error) throw error;
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
