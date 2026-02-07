// apps/xa-b/src/app/head.tsx
import { ThemeStyle } from "@acme/ui/server";

const shopId = process.env.NEXT_PUBLIC_SHOP_ID || "default";

export default async function Head() {
  return <ThemeStyle shopId={shopId} allowRemoteFonts={false} />;
}
