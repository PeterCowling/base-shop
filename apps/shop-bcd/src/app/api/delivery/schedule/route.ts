import "@acme/lib/initZod";
import { decodeCartCookie, encodeCartCookie, CART_COOKIE, asSetCookieHeader } from "@platform-core/src/cartCookie";
import { createCartStore } from "@platform-core/src/cartStore";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { parseJsonBody } from "@shared-utils";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import shop from "../../../../shop.json";

export const runtime = "edge";

const schema = z.object({ region: z.string(), window: z.string(), date: z.string() }).strict();

const selections = new Map<string, { region: string; window: string; date: string }>();

export async function POST(req: NextRequest) {
  const parsed = await parseJsonBody(req, schema, "1mb");
  if (!parsed.success) return parsed.response;

  const settings = await getShopSettings(shop.id);
  const premier = settings.premierDelivery;
  if (!premier || !premier.regions.includes(parsed.data.region) || !premier.windows.includes(parsed.data.window)) {
    return NextResponse.json({ error: "Invalid delivery selection" }, { status: 400 });
  }

  const store = createCartStore();
  let cartId = decodeCartCookie(req.cookies.get(CART_COOKIE)?.value);
  if (!cartId) {
    cartId = await store.createCart();
  }
  selections.set(cartId, parsed.data);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", asSetCookieHeader(encodeCartCookie(cartId)));
  return res;
}
