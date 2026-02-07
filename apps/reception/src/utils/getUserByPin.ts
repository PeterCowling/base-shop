import { type User, usersRecordSchema } from "../types/domains/userDomain";

let users: Record<string, User> = {};
try {
  users = usersRecordSchema.parse(
    JSON.parse(process.env["NEXT_PUBLIC_USERS_JSON"] ?? "{}")
  );
} catch {
  users = {};
}

export function getUserByPin(pin: string): User | null {
  return users[pin] ?? null;
}
