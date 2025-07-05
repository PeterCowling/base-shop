export interface CmsUser {
  id: string;
  name: string;
  email: string;
  /** bcrypt hashed password */
  password: string;
}
