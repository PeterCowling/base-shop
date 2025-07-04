import { jsx as _jsx } from "react/jsx-runtime";
// server component
import { decodeCartCookie } from "@/lib/cartCookie";
import { readShop } from "@platform-core/repositories/json.server";
import { cookies } from "next/headers";
import HeaderClient from "./HeaderClient.client";
/**
 * Reads cart cookie on the server and injects the starting quantity so the
 * first HTML paint equals the hydrated client state.
 */
export default async function Header({ lang, height = "h-16", padding = "px-6", }) {
    const cookieStore = await cookies();
    const cart = decodeCartCookie(cookieStore.get("CART_STATE")?.value);
    const initialQty = Object.values(cart).reduce((s, line) => s + line.qty, 0);
    const shopId = process.env.NEXT_PUBLIC_SHOP_ID || "default";
    const shop = await readShop(shopId);
    const nav = shop.navigation ?? [];
    return (_jsx(HeaderClient, { lang: lang, initialQty: initialQty, nav: nav, height: height, padding: padding }));
}
