// packages/auth/src/session.ts
import { cookies } from "next/headers";
import type { Role } from "./types";

export const CUSTOMER_SESSION_COOKIE = "customer_session";

export interface CustomerSession {
  customerId: string;
  role: Role;
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  const raw = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerSession;
  } catch {
    return null;
  }
}

export async function createCustomerSession(session: CustomerSession): Promise<void> {
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
  });
}

export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE);
}
