"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollMfa = enrollMfa;
exports.verifyMfa = verifyMfa;
exports.isMfaEnabled = isMfaEnabled;
exports.generateMfaToken = generateMfaToken;
exports.verifyMfaToken = verifyMfaToken;
// packages/auth/src/mfa.ts
const otplib_1 = require("otplib");
const db_1 = require("@acme/platform-core/db");
const crypto_1 = require("crypto");
const SECRET_BYTES = 20;
async function enrollMfa(customerId) {
    // otplib's default secret length yields only 16 base32 characters which
    // can be too short for some authenticators. Generate 20 bytes instead so
    // the resulting base32 string is 32 characters long.
    const secret = otplib_1.authenticator.generateSecret(SECRET_BYTES);
    await db_1.prisma.customerMfa.upsert({
        where: { customerId },
        update: { secret },
        create: { customerId, secret, enabled: false },
    });
    const otpauth = otplib_1.authenticator.keyuri(customerId, "Acme", secret);
    return { secret, otpauth };
}
async function verifyMfa(customerId, token) {
    const record = await db_1.prisma.customerMfa.findUnique({
        where: { customerId },
    });
    if (!record)
        return false;
    // Use the shared authenticator and pass a ±1 step window explicitly.
    // Types for `otplib` may not include `window`, but runtime supports it.
    // Cast through `unknown` to the function's first parameter type to avoid `any`.
    const opts = {
        token,
        secret: record.secret,
        window: 1,
    };
    const valid = otplib_1.authenticator.verify(opts);
    if (valid && !record.enabled) {
        await db_1.prisma.customerMfa.update({
            where: { customerId },
            data: { enabled: true },
        });
    }
    return valid;
}
async function isMfaEnabled(customerId) {
    const record = await db_1.prisma.customerMfa.findUnique({
        where: { customerId },
    });
    return record?.enabled ?? false;
}
const DEFAULT_MFA_TOKEN_TTL_MS = 60_000;
function generateMfaToken(ttlMs = DEFAULT_MFA_TOKEN_TTL_MS) {
    const token = (0, crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, "0");
    return { token, expiresAt: new Date(Date.now() + ttlMs) };
}
function verifyMfaToken(token, data) {
    return token === data.token && Date.now() < data.expiresAt.getTime();
}
