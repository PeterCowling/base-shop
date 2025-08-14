// apps/cms/src/auth/options.ts
import bcrypt from "bcryptjs";
import pino from "pino";
import Credentials from "next-auth/providers/credentials";
import { readRbac } from "../lib/rbacStore";
import { authSecret } from "./secret";
const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
    redact: {
        paths: ["email", "password", "*.email", "*.password"],
        censor: "[REDACTED]",
    },
});
const secret = authSecret;
export const authOptions = {
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
                if (!credentials)
                    return null;
                const { users, roles } = await readRbac();
                const user = Object.values(users).find((u) => u.email === credentials.email);
                if (user &&
                    (user.id === "1"
                        ? credentials.password === user.password
                        : await bcrypt.compare(credentials.password, user.password))) {
                    /* Strip password before handing the user object to NextAuth */
                    const { password: _password, ...safeUser } = user;
                    void _password;
                    const r = roles[user.id];
                    const role = Array.isArray(r) ? r[0] : r;
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
            /* `user` exists only on sign-in; cast to access `role` */
            if (user) {
                const u = user;
                logger.debug({ role: u.role }, "[auth] jwt assign role");
                token.role = u.role;
            }
            return token;
        },
        async session({ session, token }) {
            /* Forward the role from JWT to the client session */
            const role = token.role;
            logger.debug({ role }, "[auth] session role");
            if (role) {
                session.user.role = role;
            }
            return session;
        },
    },
    pages: { signIn: "/login" },
};
