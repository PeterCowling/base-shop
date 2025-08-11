export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export const USER_STORE: Record<string, UserRecord> = {};
