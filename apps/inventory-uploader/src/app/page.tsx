import { IBM_Plex_Mono, Work_Sans } from "next/font/google";

import InventoryHomeClient from "./InventoryHome.client";

// TASK-03: session auth gate will be added here (redirect to /login if not authenticated).

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// mono is used by InventoryConsole (TASK-12) for variant keys and SKU display.
void mono;

export default function InventoryHomePage() {
  return <InventoryHomeClient displayClassName={display.className} />;
}
