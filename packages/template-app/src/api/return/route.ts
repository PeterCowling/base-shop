import { stripe } from "@acme/stripe";
import {
  markRefunded,
  markReturned,
} from "@platform-core/repositories/rentalOrders.server";
import { computeDamageFee } from "@platform-core/src/pricing";

import { NextRequest, NextResponse } from "next/server";
import { getReturnLogistics } from "@platform-core/returnLogistics";
import { readShop } from "@platform-core/repositories/shops.server";

const SHOP_ID = "bcd";

export const runtime = "edge";

async function savePickup(appt: { zip: string; date: string; time: string }) {
  // Placeholder for database persistence
  console.log("pickup scheduled", appt);
}

async function notifyCarrier(appt: { zip: string; date: string; time: string }) {
  // Simulate notifying external carrier API; ignore failures
  try {
    await fetch("https://carrier.invalid/pickup", {
      method: "POST",
      body: JSON.stringify(appt),
    });
  } catch {
    /* noop */
  }
}

export async function POST(req: NextRequest) {
  const { sessionId, damage, zip, date, time } = (await req.json()) as {
    sessionId?: string;
    damage?: string | number;
    zip?: string;
    date?: string;
    time?: string;
  };

  const shop = await readShop(SHOP_ID);
  if (!shop.returnsEnabled) {
    return NextResponse.json(
      { error: "Returns disabled" },
      { status: 403 },
    );
  }

  if (sessionId) {
    const order = await markReturned(SHOP_ID, sessionId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const deposit = Number(session.metadata?.depositTotal ?? 0);
    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!deposit || !pi) {
      return NextResponse.json({ ok: false, message: "No deposit found" });
    }

    const damageFee = await computeDamageFee(damage, deposit);
    if (damageFee) {
      await markReturned(SHOP_ID, sessionId, damageFee);
    }
    const refund = Math.max(deposit - damageFee, 0);
    if (refund > 0) {
      await stripe.refunds.create({ payment_intent: pi, amount: refund * 100 });
      await markRefunded(SHOP_ID, sessionId);
    }

    return NextResponse.json({ ok: true });
  }

  if (zip && date && time) {
    const cfg = await getReturnLogistics();
    if (!cfg.homePickupZipCodes.includes(zip)) {
      return NextResponse.json(
        { error: "ZIP not eligible" },
        { status: 400 }
      );
    }
    const appt = { zip, date, time };
    await savePickup(appt);
    await notifyCarrier(appt);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
