// packages/auth/src/session.ts
import { cookies, headers } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { randomUUID } from "node:crypto";
import { coreEnv } from "@acme/config/env/core";
import { createSessionStore, SESSION_TTL_S } from "./store.js";
export const CUSTOMER_SESSION_COOKIE = "customer_session";
export const CSRF_TOKEN_COOKIE = "csrf_token";
const sessionStorePromise = createSessionStore();
function cookieOptions() {
    return {
        httpOnly: true,
        sameSite: "strict",
        secure: true,
        path: "/",
        maxAge: SESSION_TTL_S,
        domain: coreEnv.COOKIE_DOMAIN,
    };
}
function csrfCookieOptions() {
    return {
        httpOnly: false,
        sameSite: "strict",
        secure: true,
        path: "/",
        maxAge: SESSION_TTL_S,
        domain: coreEnv.COOKIE_DOMAIN,
    };
}
export async function getCustomerSession() {
    const secret = coreEnv.SESSION_SECRET;
    if (!secret)
        return null;
    const store = await cookies();
    const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!token)
        return null;
    let session;
    try {
        session = await unsealData(token, {
            password: secret,
            ttl: SESSION_TTL_S,
        });
    }
    catch {
        return null;
    }
    const sessionStore = await sessionStorePromise;
    const exists = await sessionStore.get(session.sessionId);
    if (!exists) {
        return null;
    }
    // rotate on activity
    const oldId = session.sessionId;
    session.sessionId = randomUUID();
    const newToken = await sealData(session, {
        password: secret,
        ttl: SESSION_TTL_S,
    });
    store.set(CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
    if (!store.get(CSRF_TOKEN_COOKIE)) {
        const csrf = randomUUID();
        store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
    }
    const ua = (await headers()).get("user-agent") ?? "unknown";
    await sessionStore.set({
        sessionId: session.sessionId,
        customerId: session.customerId,
        userAgent: ua,
        createdAt: new Date(),
    });
    await sessionStore.delete(oldId);
    const { customerId, role } = session;
    return { customerId, role };
}
export async function createCustomerSession(sessionData) {
    const secret = coreEnv.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET is not set in core environment configuration");
    }
    const store = await cookies();
    const session = {
        ...sessionData,
        sessionId: randomUUID(),
    };
    const token = await sealData(session, {
        password: secret,
        ttl: SESSION_TTL_S,
    });
    store.set(CUSTOMER_SESSION_COOKIE, token, cookieOptions());
    const csrf = randomUUID();
    store.set(CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
    const ua = (await headers()).get("user-agent") ?? "unknown";
    const sessionStore = await sessionStorePromise;
    await sessionStore.set({
        sessionId: session.sessionId,
        customerId: session.customerId,
        userAgent: ua,
        createdAt: new Date(),
    });
}
export async function destroyCustomerSession() {
    const store = await cookies();
    const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (token) {
        const secret = coreEnv.SESSION_SECRET;
        if (secret) {
            try {
                const session = await unsealData(token, {
                    password: secret,
                    ttl: SESSION_TTL_S,
                });
                const sessionStore = await sessionStorePromise;
                await sessionStore.delete(session.sessionId);
            }
            catch { }
        }
    }
    store.delete({
        name: CUSTOMER_SESSION_COOKIE,
        path: "/",
        domain: coreEnv.COOKIE_DOMAIN,
    });
    store.delete({
        name: CSRF_TOKEN_COOKIE,
        path: "/",
        domain: coreEnv.COOKIE_DOMAIN,
    });
}
export async function listSessions(customerId) {
    const sessionStore = await sessionStorePromise;
    return sessionStore.list(customerId);
}
export async function revokeSession(sessionId) {
    const sessionStore = await sessionStorePromise;
    await sessionStore.delete(sessionId);
}
export async function validateCsrfToken(token) {
    if (!token)
        return false;
    const store = await cookies();
    const cookie = store.get(CSRF_TOKEN_COOKIE)?.value;
    return token === cookie;
}
