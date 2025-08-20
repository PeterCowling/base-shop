import { promises as fs } from "node:fs";
import path from "node:path";
import { sendCampaignEmail } from "./send";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";
const DEFAULT_DELAY_MS = 1000 * 60 * 60 * 24;
function envKey(shop) {
    return `ABANDONED_CART_DELAY_MS_${shop
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "_")}`;
}
/** Resolve reminder delay for a shop (default: one day). */
export async function resolveAbandonedCartDelay(shop, dataRoot = DATA_ROOT) {
    let delay = DEFAULT_DELAY_MS;
    try {
        const file = path.join(dataRoot, shop, "settings.json");
        const json = JSON.parse(await fs.readFile(file, "utf8"));
        const cfg = json.abandonedCart?.delayMs ?? json.abandonedCartDelayMs;
        if (typeof cfg === "number")
            delay = cfg;
    }
    catch { }
    const envDelay = process.env[envKey(shop)];
    if (envDelay !== undefined) {
        const num = Number(envDelay);
        if (!Number.isNaN(num))
            return num;
    }
    const globalEnv = process.env.ABANDONED_CART_DELAY_MS;
    if (globalEnv !== undefined) {
        const num = Number(globalEnv);
        if (!Number.isNaN(num))
            return num;
    }
    return delay;
}
/**
 * Send reminder emails for carts that have been inactive for at least a given delay.
 * Carts with `reminded` set to true are ignored. When an email is sent, the
 * record's `reminded` flag is set to true.
 */
export async function recoverAbandonedCarts(carts, now = Date.now(), delayMs = DEFAULT_DELAY_MS) {
    for (const record of carts) {
        if (record.reminded)
            continue;
        if (now - record.updatedAt < delayMs)
            continue;
        await sendCampaignEmail({
            to: record.email,
            subject: "You left items in your cart",
            html: "<p>You left items in your cart.</p>",
        });
        record.reminded = true;
    }
}
