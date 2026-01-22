export interface CmsUser {
  id: string;
  name: string;
  email: string;
  /** argon2 hashed password */
  password: string;
  /**
   * List of shop IDs this user can access.
   * If undefined or empty, access is determined by role:
   * - Global admins can access all shops
   * - Other roles cannot access any shop without explicit assignment
   * Use '*' to grant access to all shops for non-admin roles.
   */
  allowedShops?: string[];
}
