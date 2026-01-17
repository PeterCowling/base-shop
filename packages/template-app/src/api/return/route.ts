import { stripe } from "@acme/stripe";
import {
  markRefunded,
  markReturned,
} from "@acme/platform-core/repositories/rentalOrders.server";
import { computeDamageFee } from "@acme/platform-core/pricing";

import { NextRequest, NextResponse } from "next/server";
import { getReturnBagAndLabel } from "@acme/platform-core/returnLogistics";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { getShopSettings } from "@acme/platform-core/repositories/settings.server";

const SHOP_ID = "bcd";

export const runtime = "edge";

async function savePickup(appt: { zip: string; date: string; time: string }) {
  // Placeholder for database persistence
  console.log(
    "pickup scheduled", // i18n-exempt -- ABC-123 [ttl=2025-12-31] developer log, not user-facing
    appt,
  );
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
  if (shop.returnsEnabled === false) {
    return NextResponse.json(
      { error: "Returns disabled" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
      { status: 403 },
    );
  }

  if (sessionId) {
    const order = await markReturned(SHOP_ID, sessionId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
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
      return NextResponse.json({ ok: false, message: "No deposit found" }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API message
    }

    const coverageCodes =
      session.metadata?.coverage?.split(",").filter(Boolean) ?? [];

    const damageFee = await computeDamageFee(
      damage,
      deposit,
      coverageCodes,
      shop.coverageIncluded,
    );
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
    const [info, settings] = await Promise.all([
      getReturnBagAndLabel(),
      getShopSettings(SHOP_ID),
    ]);
    if (!settings.returnService?.homePickupEnabled) {
      return NextResponse.json(
        { error: "Home pickup disabled" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
        { status: 403 }
      );
    }
    if (!info.homePickupZipCodes.includes(zip)) {
      return NextResponse.json(
        { error: "ZIP not eligible" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
        { status: 400 }
      );
    }
    const appt = { zip, date, time };
    await savePickup(appt);
    await notifyCarrier(appt);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 }); // i18n-exempt -- ABC-123 [ttl=2025-12-31] machine-readable API error
}
