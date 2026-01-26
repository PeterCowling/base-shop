// apps/cover-me-pretty/src/app/[lang]/head.tsx

import { ThemeStyle } from "@acme/ui/server";

import shop from "../../../shop.json";

export default async function Head() {
  // Explicitly keep remote fonts disabled in storefronts; rely on next/font.
  return <ThemeStyle shopId={shop.id} allowRemoteFonts={false} />;
}
