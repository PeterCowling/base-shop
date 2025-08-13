// apps/cms/src/auth/options.ts
/* eslint-disable no-console */
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { readRbac as defaultReadRbac } from "../lib/rbacStore";

import { env } from "@acme/config";
import type { Role } from "./roles";
import { authSecret } from "./secret";

/* -------------------------------------------------------------------------- */
/*  Secret handling                                                           */
/* -------------------------------------------------------------------------- */

const NODE_ENV = env.NODE_ENV ?? "development";

const secret = authSecret;

if (NODE_ENV === "production" && !secret) {
  throw new Error("NEXTAUTH_SECRET must be set when NODE_ENV is 'production'");
}

/* -------------------------------------------------------------------------- */
/*  AuthOptions factory (dependency‑injectable for tests)                     */
/* -------------------------------------------------------------------------- */

interface Overrides {
  readRbac?: typeof defaultReadRbac;
  bcryptCompare?: typeof bcrypt.compare;
}

export function createAuthOptions(overrides: Overrides = {}): NextAuthOptions {
  const readRbac = overrides.readRbac ?? defaultReadRbac;
  const bcryptCompare = overrides.bcryptCompare ?? bcrypt.compare;

  return {
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

          /* -------------------------------------------------------------- */
          /*  Password check                                                */
          /*  - user.id === "1": plain‑text (dev fixture)                   */
          /*  - everyone else : bcrypt                                      */
          /* -------------------------------------------------------------- */
          const ok =
            user &&
            (user.id === "1"
              ? credentials.password === user.password
              : await bcryptCompare(credentials.password, user.password));

          if (ok && user) {
            /* Strip the password before returning */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _pw, ...safeUser } = user;
            const r = roles[user.id];
            const role = Array.isArray(r) ? r[0] : (r as Role);

            console.log("[auth] login success", { id: user.id, role });

            return { ...safeUser, role };
          }

          console.log("[auth] login failed for", credentials.email);
          throw new Error("Invalid email or password");
        },
      }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const u = user as typeof user & { role: Role };
          console.log("[auth] jwt assign role", u.role);
          (token as JWT & { role: Role }).role = u.role;
        }
        return token;
      },

      async session({ session, token }) {
        const role = (token as JWT & { role?: Role }).role;
        console.log("[auth] session role", role);

        if (role) {
          (session.user as typeof session.user & { role: Role }).role = role;
        }
        return session;
      },
    },

    pages: { signIn: "/login" },
  };
}

/* -------------------------------------------------------------------------- */
/*  Default export used by the application                                    */
/* -------------------------------------------------------------------------- */
export const authOptions = createAuthOptions();
