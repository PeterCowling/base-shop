// apps/cms/src/auth/options.ts
import bcrypt from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import { readRbac } from "../lib/rbacStore";
import { authSecret } from "./secret";
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
                console.log("[auth] authorize called", credentials);
                if (!credentials)
                    return null;
                const { users, roles } = await readRbac();
                const user = Object.values(users).find((u) => u.email === credentials.email);
                console.log("[auth] found user", Boolean(user));
                if (user &&
                    (await bcrypt.compare(credentials.password, user.password))) {
                    /* Strip password before handing the user object to NextAuth */
                    const { password: _password, ...safeUser } = user;
                    void _password;
                    const r = roles[user.id];
                    const role = Array.isArray(r) ? r[0] : r;
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
            /* `user` exists only on sign-in; cast to access `role` */
            if (user) {
                const u = user;
                console.log("[auth] jwt assign role", u.role);
                token.role = u.role;
            }
            return token;
        },
        async session({ session, token }) {
            /* Forward the role from JWT to the client session */
            const role = token.role;
            console.log("[auth] session role", role);
            if (role) {
                session.user.role = role;
            }
            return session;
        },
    },
    pages: { signIn: "/login" },
};
