// server component
import { readShop } from "@platform-core/repositories/json.server";
import {
  CART_COOKIE,
  decodeCartCookie,
  type CartState,
} from "@platform-core/cartCookie";
import { createCartStore } from "@platform-core/cartStore";
import { cookies } from "next/headers";
import HeaderClient from "./HeaderClient.client";

/**
 * Reads cart cookie on the server and injects the starting quantity so the
 * first HTML paint equals the hydrated client state.
 */
export default async function Header({
  lang,
  height = "h-16",
  padding = "px-6",
}: {
  lang: string;
  height?: string;
  padding?: string;
}) {
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cartStore = createCartStore();
  const cart: CartState = cartId ? await cartStore.getCart(cartId) : {};
  const initialQty = Object.values(cart).reduce((s, line) => s + line.qty, 0);
  const shopId = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const shop = await readShop(shopId);
  const nav = shop.navigation ?? [];

  return (
    <HeaderClient
      lang={lang}
      initialQty={initialQty}
      nav={nav}
      height={height}
      padding={padding}
    />
  );
}
