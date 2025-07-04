// apps/cms/src/auth/options.ts

import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { readRbac } from "../lib/rbacStore";
import type { Role } from "./roles";
import { authSecret } from "./secret";

/* -----------------------------------------------------------------
 *  Ensure NEXTAUTH_SECRET is defined outside of development
 * ---------------------------------------------------------------- */
const secret = authSecret;
if (process.env.NODE_ENV !== "development" && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    "NEXTAUTH_SECRET must be set when NODE_ENV is not 'development'"
  );
}

export const authOptions: NextAuthOptions = {
  /* ----------------------------------------------------------------
   *  Ensure `secret` is never undefined in production
   * -------------------------------------------------------------- */
  ...(secret ? { secret } : {}),

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize called", credentials);

        if (!credentials) return null;

        const { users, roles } = await readRbac();
        const user = Object.values(users).find(
          (u) => u.email === credentials.email
        );

        console.log("[auth] found user", Boolean(user));

        if (
          user &&
          (user.id === "1"
            ? credentials.password === user.password
            : await bcrypt.compare(credentials.password, user.password))
        ) {
          /* Strip password before handing the user object to NextAuth */
          const { password: _password, ...safeUser } = user;
          void _password;
          const r = roles[user.id];
          const role = Array.isArray(r) ? r[0] : r;
          console.log("[auth] login success", { id: user.id, role });

          return { ...safeUser, role } as typeof safeUser & { role: Role };
        }
        console.log("[auth] login failed for", credentials.email);

        throw new Error("Invalid email or password");
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      /* `user` exists only on sign-in; type augmentation guarantees `role` */
      if (user) {
        const u = user as typeof user & { role: Role };
        console.log("[auth] jwt assign role", u.role);
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      /* Forward the role from JWT to the client session */
      console.log("[auth] session role", token.role);

      (session.user as typeof session.user & { role?: Role }).role = token.role;
      return session;
    },
  },

  pages: { signIn: "/login" },
};
