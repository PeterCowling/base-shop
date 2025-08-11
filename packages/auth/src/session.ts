// packages/auth/src/session.ts
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Role } from "./types";

export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const CSRF_TOKEN_COOKIE = "csrf_token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // one week

export interface CustomerSession {
  customerId: string;
  role: Role;
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

  const { customerId, role } = payload;
  return { customerId, role };
}

export async function createCustomerSession(session: CustomerSession): Promise<void> {
  const store = await cookies();
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }

  const exp = Date.now() + SESSION_TTL_MS;
  const encoded = encode({ ...session, exp });
  const signature = sign(encoded, secret);
  const token = `${encoded}.${signature}`;

  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: true,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    expires: new Date(exp),
  });

  const csrfToken = randomBytes(32).toString("hex");
  store.set(CSRF_TOKEN_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: true,
  });
}

export async function validateCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const store = await cookies();
  const cookieToken = store.get(CSRF_TOKEN_COOKIE)?.value;
  return cookieToken === token;
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE);
}
