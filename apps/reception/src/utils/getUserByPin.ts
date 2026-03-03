import { type User, usersRecordSchema } from "../types/domains/userDomain";

let users: Record<string, User> = {};
try {
  users = usersRecordSchema.parse(
    JSON.parse(process.env["NEXT_PUBLIC_USERS_JSON"] ?? "{}")
  ) as unknown as Record<string, User>;
} catch {
  users = {};
}

/**
 * @deprecated Not currently wired into the auth flow.
 * The device-PIN quick-unlock in Login.tsx relies on the existing Firebase session
 * (onAuthStateChanged) rather than this lookup. This function may be wired in
 * future for a shift-PIN staff login path. Remove if that path is not needed.
 */
export function getUserByPin(pin: string): User | null {
  return users[pin] ?? null;
}
