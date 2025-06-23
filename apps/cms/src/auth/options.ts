// apps/cms/src/auth/options.ts
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "../types/next-auth";
import { USERS } from "./roles";

export const authOptions: NextAuthOptions = {
  /* ------------------------------------------------------------ */
  /*  Conditionally add `secret` so it’s never undefined          */
  /* ------------------------------------------------------------ */
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
          const { password, ...safeUser } = user; // strip password
          return safeUser;
        }
        return null; // invalid creds ⇒ 401
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role as Role;
      return session;
    },
  },

  pages: { signIn: "/login" },
};
