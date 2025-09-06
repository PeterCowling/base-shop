import type { User } from "@acme/types";

export declare function getUserById(id: string): Promise<User | null>;
export declare function getUserByEmail(email: string): Promise<User | null>;
export declare function createUser({
  id,
  email,
  passwordHash,
  role,
  emailVerified,
}: {
  id: string;
  email: string;
  passwordHash: string;
  role?: string;
  emailVerified?: boolean;
}): Promise<User>;
export declare function setResetToken(
  id: string,
  token: string | null,
  expiresAt: Date | null,
): Promise<void>;
export declare function getUserByResetToken(
  token: string,
): Promise<User | null>;
export declare function updatePassword(
  id: string,
  passwordHash: string,
): Promise<void>;
export declare function verifyEmail(id: string): Promise<void>;
