// apps/shop-abc/src/app/api/rental/route.ts
import { stripe } from "@/lib/stripeServer";
import { addOrder, markReturned, } from "@platform-core/repositories/rentalOrders.server";
import { NextResponse } from "next/server";
export const runtime = "edge";
export async function POST(req) {
    const { sessionId } = (await req.json());
    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const deposit = Number(session.metadata?.depositTotal ?? 0);
    const expected = session.metadata?.returnDate || undefined;
    await addOrder("abc", sessionId, deposit, expected);
    return NextResponse.json({ ok: true });
}
export async function PATCH(req) {
    const { sessionId, damageFee } = (await req.json());
    if (!sessionId) {
        return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    const order = await markReturned("abc", sessionId, damageFee);
    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
    });
    const pi = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (pi && order.deposit) {
        const refund = Math.max(order.deposit - (damageFee ?? 0), 0);
        if (refund > 0) {
            await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
        }
    }
    return NextResponse.json({ ok: true });
}
