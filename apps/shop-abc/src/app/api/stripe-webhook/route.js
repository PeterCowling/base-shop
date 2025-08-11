// apps/shop-abc/src/app/api/stripe-webhook/route.ts
import { addOrder, markRefunded, } from "@acme/orders";
import { NextResponse } from "next/server";
export const runtime = "edge";
export async function POST(req) {
    const payload = (await req.json());
    const eventType = payload.type;
    const data = payload.data?.object;
    switch (eventType) {
        case "checkout.session.completed": {
            const session = data;
            const deposit = Number(session.metadata?.depositTotal ?? 0);
            const returnDate = session.metadata?.returnDate || undefined;
            const customerId = session.metadata?.customerId || undefined;
            await addOrder("abc", session.id, deposit, returnDate, customerId);
            break;
        }
        case "charge.refunded": {
            const charge = data;
            const sessionId = (() => {
                if (typeof charge.payment_intent !== "string" &&
                    charge.payment_intent) {
                    const pi = charge.payment_intent;
                    return pi.charges?.data?.[0]?.invoice || undefined;
                }
                return undefined;
            })();
            const sid = sessionId || charge.id;
            await markRefunded("abc", sid);
            break;
        }
        default:
            break;
    }
    return NextResponse.json({ received: true });
}
