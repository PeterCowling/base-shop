import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasInventorySessionFromCookieHeader } from "../lib/auth/session";

import { inventoryDisplayFont } from "./inventoryFonts";
import InventoryHomeClient from "./InventoryHome.client";

export default async function InventoryHomePage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasInventorySessionFromCookieHeader(cookieHeader);
  if (!authenticated) {
    redirect("/login");
  }

  return <InventoryHomeClient displayClassName={inventoryDisplayFont.className} />;
}
