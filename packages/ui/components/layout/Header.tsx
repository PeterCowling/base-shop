// server component
import { decodeCartCookie } from "@/lib/cartCookie";
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
  const cart = decodeCartCookie(cookieStore.get("CART_STATE")?.value);
  const initialQty = Object.values(cart).reduce((s, line) => s + line.qty, 0);

  return (
    <HeaderClient
      lang={lang}
      initialQty={initialQty}
      height={height}
      padding={padding}
    />
  );
}
