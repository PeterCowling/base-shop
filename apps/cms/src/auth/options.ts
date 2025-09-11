// apps/cms/src/auth/options.ts
import "server-only";
import argon2 from "argon2";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { readRbac as defaultReadRbac } from "../lib/server/rbacStore";

import { logger } from "@acme/shared-utils";

import type { Role } from "@acme/types";
import { authSecret } from "./secret";

/* -------------------------------------------------------------------------- */
/*  Secret handling                                                           */
/* -------------------------------------------------------------------------- */

// Explicitly type the secret so NextAuth receives a string
const secret: string = authSecret as string;

/* -------------------------------------------------------------------------- */
/*  AuthOptions factory (dependency‑injectable for tests)                     */
/* -------------------------------------------------------------------------- */

export interface AuthOverrides {
  readRbac?: typeof defaultReadRbac;
  argonVerify?: typeof argon2.verify;
}

export function createAuthOptions(
  overrides: AuthOverrides = {}
): NextAuthOptions {
  const readRbac = overrides.readRbac ?? defaultReadRbac;
  const argonVerify = overrides.argonVerify ?? argon2.verify;

  return {
    secret,

    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          logger.debug("[auth] authorize called");

          if (!credentials) return null;

          const { users, roles } = await readRbac();
          const user = Object.values(users).find(
            (u) => u.email === credentials.email
          );
          logger.debug("[auth] user lookup", { found: Boolean(user) });

          /* -------------------------------------------------------------- */
          /*  Password check                                                */
          /*  - dev fixture allowed only in development                     */
          /*  - otherwise require argon2 hashed passwords                   */
          /* -------------------------------------------------------------- */
          const isDevFixture =
            process.env.NODE_ENV === "development" && user?.id === "1";

          if (user && !isDevFixture && !user.password.startsWith("$argon2")) {
            console.log("[auth] user password is not hashed", { id: user.id });
            throw new Error("Invalid email or password");
          }

          const ok =
            user &&
            (isDevFixture
              ? credentials.password === user.password
              : await argonVerify(user.password, credentials.password));

          if (ok && user) {
            /* Strip the password before returning */
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _pw, ...safeUser } = user;
            const r = roles[user.id];
            const role = Array.isArray(r) ? (r[0] as Role) : (r as Role);

            logger.info("[auth] login success", { userId: user.id, role });

            return { ...safeUser, role };
          }

          logger.warn("[auth] login failed");
          throw new Error("Invalid email or password");
        },
      }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const u = user as typeof user & { role: Role };
          logger.debug("[auth] jwt assign role", { role: u.role });
          (token as JWT & { role: Role }).role = u.role;
        }
        return token;
      },

      async session({ session, token }) {
        const role = (token as JWT & { role?: Role }).role;
        logger.debug("[auth] session role", { role });

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
