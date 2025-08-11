// packages/auth/src/session.ts
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import type { Role } from "./types";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // one week

interface StoredSession {
  customerId: string;
  role: Role;
  userAgent?: string;
  createdAt: number;
}

const sessionStore = new Map<string, StoredSession>();

export interface CustomerSession {
  customerId: string;
  role: Role;
  sessionId: string;
}

export interface ActiveSession extends CustomerSession {
  userAgent?: string;
  createdAt: number;
}

function encode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded, secret);
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
    return null;
  }

  const { sessionId, customerId, role } = payload;
  const record = sessionStore.get(sessionId);
  if (!record || record.customerId !== customerId) {
    return null;
  }

  return { sessionId, customerId, role };
}

export async function createCustomerSession(
  session: { customerId: string; role: Role },
  userAgent = "unknown",
): Promise<void> {
  const store = await cookies();
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  const sessionId = randomBytes(16).toString("hex");
  sessionStore.set(sessionId, {
    customerId: session.customerId,
    role: session.role,
    userAgent,
    createdAt: Date.now(),
  });

  const exp = Date.now() + SESSION_TTL_MS;
  const encoded = encode({ ...session, sessionId, exp });
  const signature = sign(encoded, secret);
  const token = `${encoded}.${signature}`;

  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    expires: new Date(exp),
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (token) {
    const [encoded] = token.split(".");
    try {
      const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
      if (payload.sessionId) {
        sessionStore.delete(payload.sessionId);
      }
    } catch {
      // ignore
    }
  }
  store.delete(CUSTOMER_SESSION_COOKIE);
}

export function listCustomerSessions(customerId: string): ActiveSession[] {
  const sessions: ActiveSession[] = [];
  for (const [id, s] of sessionStore.entries()) {
    if (s.customerId === customerId) {
      sessions.push({
        sessionId: id,
        customerId: s.customerId,
        role: s.role,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
      });
    }
  }
  return sessions;
}

export function revokeSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

export { sessionStore };
