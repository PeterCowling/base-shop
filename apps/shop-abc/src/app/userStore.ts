import type { Role } from "@auth/types/roles";

export interface UserRecord {
  password: string;
  role: Role;
  email: string;
  resetToken?: string;
}

export const USER_STORE: Record<string, UserRecord> = {
  cust1: { password: "pass1", role: "customer", email: "cust1@example.com" },
  viewer1: { password: "view", role: "viewer", email: "viewer1@example.com" },
  admin1: { password: "admin", role: "admin", email: "admin1@example.com" },
};

export function addUser(id: string, email: string, password: string) {
  USER_STORE[id] = { password, role: "customer", email };
}

export function findUserByEmail(email: string) {
  return Object.entries(USER_STORE).find(([, u]) => u.email === email);
}
