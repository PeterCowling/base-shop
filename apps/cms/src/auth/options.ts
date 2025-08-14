// apps/cms/src/auth/options.ts
import bcrypt from "bcryptjs";
import pino from "pino";
import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { readRbac as defaultReadRbac } from "../lib/rbacStore";

import type { Role } from "./roles";
import { authSecret } from "./secret";

/* -------------------------------------------------------------------------- */
/*  Secret handling                                                           */
/* -------------------------------------------------------------------------- */

const secret = authSecret;

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: ["email", "password", "*.email", "*.password"],
    censor: "[REDACTED]",
  },
});

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
    secret,

    providers: [
      Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          logger.debug({ email: credentials?.email }, "[auth] authorize called");

          if (!credentials) return null;

          const { users, roles } = await readRbac();
          const user = Object.values(users).find(
            (u) => u.email === credentials.email
          );


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

            logger.info({ id: user.id, role }, "[auth] login success");

            return { ...safeUser, role };
          }

          logger.warn({ email: credentials.email }, "[auth] login failed");
          throw new Error("Invalid email or password");
        },
      }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const u = user as typeof user & { role: Role };
          logger.debug({ role: u.role }, "[auth] jwt assign role");
          (token as JWT & { role: Role }).role = u.role;
        }
        return token;
      },

      async session({ session, token }) {
        const role = (token as JWT & { role?: Role }).role;
        logger.debug({ role }, "[auth] session role");

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
