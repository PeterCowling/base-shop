// apps/cms/src/types/next-auth.d.ts
import "next-auth";

export type Role = "admin" | "viewer";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
    };
  }

  interface JWT {
    role?: Role;
  }
}
