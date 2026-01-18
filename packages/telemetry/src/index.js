"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__stripPII = exports.__flush = exports.__buffer = void 0;
exports.track = track;
const BUFFER = [];
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 3;
const rawRate = Number(process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE ?? "1");
const SAMPLE_RATE = Number.isNaN(rawRate)
    ? 1
    : Math.min(1, Math.max(0, rawRate));
const ENABLED = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === "true" &&
    (process.env.NODE_ENV === "production" || process.env.FORCE_TELEMETRY === "true");
const ENDPOINT = process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT ?? "/api/telemetry";
let timer = null;
function stripPII(payload) {
    const result = {};
    const piiRegex = /(email|name|phone|address|password|token|id)/i;
    for (const [key, value] of Object.entries(payload)) {
        if (!piiRegex.test(key)) {
            result[key] = value;
        }
    }
    return result;
}
async function flush() {
    if (!BUFFER.length)
        return;
    const events = BUFFER.splice(0, BUFFER.length);
    let attempts = 0;
    while (attempts < MAX_RETRIES) {
        try {
            await fetch(ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(events),
            });
            break;
        }
        catch (err) {
            attempts++;
            // i18n-exempt -- DX-1023 [ttl=2026-12-31] developer log only; not user-facing UI
            console.error("Failed to send telemetry", err);
            if (attempts >= MAX_RETRIES) {
                BUFFER.unshift(...events); // restore
            }
        }
    }
}
function scheduleFlush() {
    if (timer)
        return;
    timer = setTimeout(async () => {
        timer = null;
        await flush();
    }, FLUSH_INTERVAL);
}
function track(name, payload = {}) {
    if (!ENABLED)
        return;
    if (Math.random() > SAMPLE_RATE)
        return;
    if (typeof navigator !== "undefined" && navigator.onLine === false)
        return;
    BUFFER.push({ name, payload: stripPII(payload), ts: Date.now() });
    scheduleFlush();
}
// For testing purposes
exports.__buffer = BUFFER;
exports.__flush = flush;
exports.__stripPII = stripPII;
