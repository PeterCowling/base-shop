// apps/cms/src/auth/options.ts

import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { USERS } from "./roles";

export const authOptions: NextAuthOptions = {
  /* ----------------------------------------------------------------
   *  Ensure `secret` is never undefined in production
   * -------------------------------------------------------------- */
  ...(process.env.NEXTAUTH_SECRET
    ? { secret: process.env.NEXTAUTH_SECRET }
    : {}),

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = Object.values(USERS).find(
          (u) => u.email === credentials.email
        );

        if (user && user.password === credentials.password) {
          /* Strip password before handing the user object to NextAuth */
          const { password: _password, ...safeUser } = user;
          void _password;
          return safeUser; // typed as `User` via module augmentation
        }
        throw new Error("Invalid email or password");
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      /* `user` exists only on sign-in; type augmentation guarantees `role` */
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      /* Forward the role from JWT to the client session */
      session.user.role = token.role;
      return session;
    },
  },

  pages: { signIn: "/login" },
};
