import {
  getShopSettings,
  readShop,
} from "@platform-core/repositories/shops.server";
import { env } from "@acme/config";

export default async function AnalyticsScripts() {
  const shop = env.NEXT_PUBLIC_SHOP_ID || "default";
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
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${analytics.id}`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${analytics.id}');`,
          }}
        />
      </>
    );
  }
  return null;
}
