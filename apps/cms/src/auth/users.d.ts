export interface CmsUser {
  id: string;
  name: string;
  email: string;
  /** argon2 hashed password */
  password: string;
}
/** Phase-0 in-memory users (replace with DB in Phase-1). */
export declare const USERS: Record<string, CmsUser>;
//# sourceMappingURL=users.d.ts.map
