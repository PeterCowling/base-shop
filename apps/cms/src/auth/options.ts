// apps/cms/src/auth/options.ts
import "server-only";

import type { NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";

import { logger } from "@acme/lib/logger";
import type { Role } from "@acme/types";

import { readRbac as defaultReadRbac } from "../lib/server/rbacStore";

import { authSecret } from "./secret";
import { USERS as FALLBACK_USERS } from "./users";

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
        // i18n-exempt — provider name unused with custom sign-in page
        name: "Credentials",
        credentials: {
          // i18n-exempt — labels only used by NextAuth default page; app uses /login
          email: { label: "Email", type: "text" },
          // i18n-exempt — see above
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          // i18n-exempt — log/debug string
          logger.debug("[auth] authorize called");

          if (!credentials) return null;

          const { users, roles } = await readRbac();
          let user = Object.values(users).find(
            (u) => u.email === credentials.email
          );

          if (!user) {
            user = Object.values(FALLBACK_USERS).find(
              (u) => u.email === credentials.email
            );
          }
          // i18n-exempt — log/debug string
          logger.debug("[auth] user lookup", { found: Boolean(user) });

          /* -------------------------------------------------------------- */
          /*  Password check                                                */
          /*  - dev fixture allowed only in development (plain "admin")     */
          /*  - otherwise require argon2 hashed passwords                   */
          /* -------------------------------------------------------------- */
          const passwordIsArgonHash =
            typeof user?.password === "string" &&
            user.password.startsWith("$argon2");

          const isDevFixture =
            process.env.NODE_ENV === "development" &&
            user?.id === "1" &&
            !passwordIsArgonHash;

          if (user && !isDevFixture && !passwordIsArgonHash) {
            // i18n-exempt — ops log
            logger.warn("[auth] user password is not hashed", { id: user.id });
            // i18n-exempt — surfaced via client mapping; tests assert this literal
            throw new Error("Invalid email or password");
          }

          const ok =
            user &&
            (isDevFixture
              ? credentials.password === user.password
              : passwordIsArgonHash &&
                (await argonVerify(user.password, credentials.password)));

          if (ok && user) {
            /* Strip the password before returning */

            const { password: _pw, allowedShops, ...safeUser } = user;
            const r = roles[user.id];
            const role = Array.isArray(r) ? (r[0] as Role) : (r as Role);

            // i18n-exempt — log/info string
            logger.info("[auth] login success", { userId: user.id, role });

            return { ...safeUser, role, allowedShops };
          }

          // i18n-exempt — log/warn string
          logger.warn("[auth] login failed");
          // i18n-exempt — surfaced via client mapping; tests assert this literal
          throw new Error("Invalid email or password");
        },
      }),
    ],

    session: { strategy: "jwt" },

    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          const u = user as typeof user & { role: Role; allowedShops?: string[] };
          // i18n-exempt — log/debug string
          logger.debug("[auth] jwt assign role", { role: u.role });
          const t = token as JWT & { role: Role; allowedShops?: string[] } & { id?: string };
          t.role = u.role;
          t.allowedShops = u.allowedShops;
          // Ensure we keep a stable identifier available to session callback
          // NextAuth typically sets `sub` from user.id, but we mirror on `id` too.
          // next-auth's `user` can be `User | AdapterUser`; safely access id
          const maybeId = (user as unknown as { id?: string | number })["id"];
          if (maybeId != null) t.id = String(maybeId);
        }
        return token;
      },

      async session({ session, token }) {
        const t = token as JWT & { role?: Role; allowedShops?: string[] };
        // i18n-exempt — log/debug string
        logger.debug("[auth] session role", { role: t.role });

        if (t.role) {
          (session.user as typeof session.user & { role: Role }).role = t.role;
        }
        if (t.allowedShops) {
          (session.user as typeof session.user & { allowedShops?: string[] }).allowedShops = t.allowedShops;
        }
        // Propagate a user id into the session so API routes can identify
        // per-user configurator state.
        const id = (token as JWT & { sub?: string; id?: string }).id ??
          (token as JWT & { sub?: string }).sub;
        if (id) {
          (session.user as Record<string, unknown>)["id"] = id;
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
