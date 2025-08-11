// packages/auth/src/session.ts
import { cookies } from "next/headers";
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
  // rotate on activity
  session.sessionId = randomUUID();
  const newToken = await sealData(session, {
    password: secret,
    ttl: SESSION_TTL_S,
  });
  store.set(CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
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
  const csrfToken = randomUUID();
  store.set(CSRF_TOKEN_COOKIE, csrfToken, csrfCookieOptions());
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  });
  store.delete(CSRF_TOKEN_COOKIE, {
    path: "/",
    domain: process.env.COOKIE_DOMAIN,
  });
}

export async function verifyCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const store = await cookies();
  const stored = store.get(CSRF_TOKEN_COOKIE)?.value;
  return stored === token;
}

export async function getCsrfToken(): Promise<string> {
  const store = await cookies();
  let token = store.get(CSRF_TOKEN_COOKIE)?.value;
  if (!token) {
    token = randomUUID();
    store.set(CSRF_TOKEN_COOKIE, token, csrfCookieOptions());
  }
  return token;
}
