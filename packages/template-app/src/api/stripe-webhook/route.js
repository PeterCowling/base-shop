// packages/template-app/src/api/stripe-webhook/route.ts
import { addOrder, markRefunded, } from "@platform-core/repositories/rentalOrders.server";
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
            await addOrder("bcd", session.id, deposit, returnDate);
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
            await markRefunded("bcd", sid);
            break;
        }
        default:
            break;
    }
    return NextResponse.json({ received: true });
}
