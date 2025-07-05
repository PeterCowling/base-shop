import { stripe } from "@/lib/stripeServer";
import { markRefunded, readOrders, } from "@platform-core/repositories/rentalOrders.server";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
async function processShop(shop) {
    var _a, _b;
    const orders = await readOrders(shop);
    for (const order of orders) {
        const deposit = (_a = order.deposit) !== null && _a !== void 0 ? _a : 0;
        const sessionId = order.sessionId;
        if (order.returnedAt && !order.refundedAt && deposit > 0 && sessionId) {
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ["payment_intent"],
            });
            const pi = typeof session.payment_intent === "string"
                ? session.payment_intent
                : (_b = session.payment_intent) === null || _b === void 0 ? void 0 : _b.id;
            if (!pi)
                continue;
            await stripe.refunds.create({
                payment_intent: pi,
                amount: deposit * 100,
            });
            await markRefunded(shop, sessionId);
            console.log(`refunded deposit for ${sessionId} (${shop})`);
        }
    }
}
async function main() {
    const shopsDir = join(process.cwd(), "data", "shops");
    const shops = await readdir(shopsDir);
    for (const shop of shops) {
        await processShop(shop);
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
