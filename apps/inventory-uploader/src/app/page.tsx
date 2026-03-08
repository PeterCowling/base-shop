import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasInventorySessionFromCookieHeader } from "../lib/auth/session";

import InventoryHomeClient from "./InventoryHome.client";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// mono is used by InventoryConsole (TASK-12) for variant keys and SKU display.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// mono className will be threaded through when TASK-12 wires InventoryConsole.
void mono;

export default async function InventoryHomePage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasInventorySessionFromCookieHeader(cookieHeader);
  if (!authenticated) {
    redirect("/login");
  }

  return <InventoryHomeClient displayClassName={display.className} />;
}
