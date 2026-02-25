import Script from "next/script";

import { coreEnv } from "@acme/config/env/core";
import {
  getShopSettings,
  readShop,
} from "@acme/platform-core/repositories/shops.server";

export default async function AnalyticsScripts() {
  const shop = (coreEnv.NEXT_PUBLIC_SHOP_ID as string | undefined) || "default";
  const [settings, shopData] = await Promise.all([
    getShopSettings(shop),
    readShop(shop),
  ]);
  if (!shopData.analyticsEnabled) return null;
  const analytics = settings.analytics;
  if (!analytics || analytics.enabled === false || !analytics.provider) return null;
  if (analytics.provider === "ga" && analytics.id) {
    return (
      <>
        <Script
          // i18n-exempt -- TMP-2041 [ttl=2026-12-31]
          src={`https://www.googletagmanager.com/gtag/js?id=${analytics.id}`}
          // i18n-exempt -- TMP-2041 [ttl=2026-12-31]
          strategy="afterInteractive"
        />
        <Script
          // i18n-exempt -- TMP-2041 [ttl=2026-12-31]
          id="ga-inline-init"
          // i18n-exempt -- TMP-2041 [ttl=2026-12-31]
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${analytics.id}');`,
          }}
        />
      </>
    );
  }
  return null;
}
