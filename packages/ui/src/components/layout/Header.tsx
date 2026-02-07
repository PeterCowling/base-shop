// packages/ui/src/components/layout/Header.tsx

import { cookies } from "next/headers";

import type { CartLine, CartState } from "@acme/platform-core/cart";
import { CART_COOKIE, decodeCartCookie } from "@acme/platform-core/cartCookie";
import { createCartStore } from "@acme/platform-core/cartStore";
import { readShop } from "@acme/platform-core/repositories/json.server";

import HeaderClient from "./HeaderClient.client";

/**
 * Represents a raw navigation item as it may be stored in the shop
 * configuration.  The label can be a plain string or an object keyed by
 * locale codes.
 */
interface NavigationItem {
  readonly label: unknown;
  readonly url: string;
}

/**
 * Represents a processed navigation item with a guaranteed string label.
 */
interface ProcessedNavigationItem {
  readonly label: string;
  readonly url: string;
}

/**
 * Server component that reads cart and shop data to populate the header.
 *
 * The navigation items returned by `readShop` may include localisation
 * objects instead of plain strings.  Before passing them to the client,
 * this component normalises each item so that its `label` property is
 * always a string.  It chooses the current `lang` if available, falls
 * back to an English (`en`) translation, and finally uses the first
 * available value or coerces the label to a string.
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
  // Read the cart cookie so the header can display the initial quantity
  const cookieStore = await cookies();
  const cartId = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
  const cartStore = createCartStore();
  const cart: CartState =
    typeof cartId === "string" ? await cartStore.getCart(cartId) : {};
  const initialQty = Object.values<CartLine>(cart).reduce(
    (s, line) => s + line.qty,
    0,
  );

  // Read the shop configuration, including navigation
  const shopId = process.env.NEXT_PUBLIC_SHOP_ID || "default";
  const shop = await readShop(shopId);
  const rawNav: NavigationItem[] = shop.navigation ?? [];

  // Normalise navigation labels to strings
  const nav: ProcessedNavigationItem[] = rawNav.map((item) => {
    let label: string;
    const rawLabel = item.label;
    if (typeof rawLabel === "string") {
      // Already a string
      label = rawLabel;
    } else if (
      rawLabel &&
      typeof rawLabel === "object" &&
      !Array.isArray(rawLabel)
    ) {
      // Localised record (e.g., { en: "Home", de: "Startseite" })
      const record = rawLabel as Record<string, string>;
      label =
        record[lang] ??
        record.en ??
        // Use the first available translation if specific locales are missing
        (Object.values(record)[0] as string | undefined) ??
        "";
    } else {
      // Fallback: convert unknown label types to string
      label = String(rawLabel ?? "");
    }
    return { label, url: item.url };
  });

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
