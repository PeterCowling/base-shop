"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRF_TOKEN_COOKIE = exports.CUSTOMER_SESSION_COOKIE = void 0;
exports.getCustomerSession = getCustomerSession;
exports.createCustomerSession = createCustomerSession;
exports.destroyCustomerSession = destroyCustomerSession;
exports.listSessions = listSessions;
exports.revokeSession = revokeSession;
exports.validateCsrfToken = validateCsrfToken;
// packages/auth/src/session.ts
require("server-only");
const headers_1 = require("next/headers");
const iron_session_1 = require("iron-session");
const crypto_1 = require("crypto");
const core_1 = require("@acme/config/env/core");
const store_1 = require("./store");
exports.CUSTOMER_SESSION_COOKIE = "customer_session";
exports.CSRF_TOKEN_COOKIE = "csrf_token";
const sessionStorePromise = (0, store_1.createSessionStore)();
const REMEMBER_ME_TTL_S = 60 * 60 * 24 * 30;
const isSecureEnv = process.env.NODE_ENV !== "development";
function cookieOptions(maxAge = store_1.SESSION_TTL_S) {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecureEnv,
        path: "/",
        maxAge,
    };
}
function csrfCookieOptions(maxAge = store_1.SESSION_TTL_S) {
    return {
        httpOnly: false,
        sameSite: "lax",
        secure: isSecureEnv,
        path: "/",
        maxAge,
    };
}
async function getCustomerSession() {
    const secret = core_1.coreEnv.SESSION_SECRET;
    if (!secret)
        return null;
    const store = await (0, headers_1.cookies)();
    const token = store.get(exports.CUSTOMER_SESSION_COOKIE)?.value;
    if (!token)
        return null;
    let session;
    try {
        session = await (0, iron_session_1.unsealData)(token, {
            password: secret,
            ttl: store_1.SESSION_TTL_S,
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
    if (exists.createdAt &&
        Date.now() - new Date(exists.createdAt).getTime() > store_1.SESSION_TTL_S * 1000) {
        await sessionStore.delete(session.sessionId);
        return null;
    }
    // rotate on activity
    const oldId = session.sessionId;
    session.sessionId = (0, crypto_1.randomUUID)();
    const newToken = await (0, iron_session_1.sealData)(session, {
        password: secret,
        ttl: store_1.SESSION_TTL_S,
    });
    const ua = (await (0, headers_1.headers)()).get("user-agent") ?? "unknown";
    await sessionStore.set({
        sessionId: session.sessionId,
        customerId: session.customerId,
        userAgent: ua,
        createdAt: new Date(),
    });
    await sessionStore.delete(oldId);
    store.set(exports.CUSTOMER_SESSION_COOKIE, newToken, cookieOptions());
    if (!store.get(exports.CSRF_TOKEN_COOKIE)) {
        const csrf = (0, crypto_1.randomUUID)();
        store.set(exports.CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions());
    }
    const { customerId, role } = session;
    return { customerId, role };
}
async function createCustomerSession(sessionData, options = {}) {
    const secret = core_1.coreEnv.SESSION_SECRET;
    if (!secret) {
        throw new Error("SESSION_SECRET is not set in core environment configuration");
    }
    const store = await (0, headers_1.cookies)();
    const session = {
        ...sessionData,
        sessionId: (0, crypto_1.randomUUID)(),
    };
    const token = await (0, iron_session_1.sealData)(session, {
        password: secret,
        ttl: store_1.SESSION_TTL_S,
    });
    const maxAge = options.remember ? REMEMBER_ME_TTL_S : store_1.SESSION_TTL_S;
    store.set(exports.CUSTOMER_SESSION_COOKIE, token, cookieOptions(maxAge));
    const csrf = (0, crypto_1.randomUUID)();
    store.set(exports.CSRF_TOKEN_COOKIE, csrf, csrfCookieOptions(maxAge));
    const ua = (await (0, headers_1.headers)()).get("user-agent") ?? "unknown";
    const sessionStore = await sessionStorePromise;
    await sessionStore.set({
        sessionId: session.sessionId,
        customerId: session.customerId,
        userAgent: ua,
        createdAt: new Date(),
    });
}
async function destroyCustomerSession() {
    const store = await (0, headers_1.cookies)();
    const token = store.get(exports.CUSTOMER_SESSION_COOKIE)?.value;
    let error;
    if (token) {
        const secret = core_1.coreEnv.SESSION_SECRET;
        if (secret) {
            try {
                const session = await (0, iron_session_1.unsealData)(token, {
                    password: secret,
                    ttl: store_1.SESSION_TTL_S,
                });
                if (session.sessionId) {
                    const sessionStore = await sessionStorePromise;
                    try {
                        await sessionStore.delete(session.sessionId);
                    }
                    catch (err) {
                        error = err;
                    }
                }
            }
            catch {
                // ignore invalid tokens
            }
        }
    }
    store.delete({
        name: exports.CUSTOMER_SESSION_COOKIE,
        path: "/",
    });
    store.delete({
        name: exports.CSRF_TOKEN_COOKIE,
        path: "/",
    });
    if (core_1.coreEnv.COOKIE_DOMAIN) {
        store.delete({
            name: exports.CUSTOMER_SESSION_COOKIE,
            path: "/",
            domain: core_1.coreEnv.COOKIE_DOMAIN,
        });
        store.delete({
            name: exports.CSRF_TOKEN_COOKIE,
            path: "/",
            domain: core_1.coreEnv.COOKIE_DOMAIN,
        });
    }
    if (error)
        throw error;
}
async function listSessions(customerId) {
    const sessionStore = await sessionStorePromise;
    return sessionStore.list(customerId);
}
async function revokeSession(sessionId) {
    const sessionStore = await sessionStorePromise;
    await sessionStore.delete(sessionId);
}
async function validateCsrfToken(token) {
    if (!token)
        return false;
    const store = await (0, headers_1.cookies)();
    const cookie = store.get(exports.CSRF_TOKEN_COOKIE)?.value;
    return token === cookie;
}
