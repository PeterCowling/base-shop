import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { getShopSettings } from "@platform-core/repositories/shops.server";
export default async function AnalyticsScripts() {
    const shop = process.env.NEXT_PUBLIC_SHOP_ID || "default";
    const settings = await getShopSettings(shop);
    const analytics = settings.analytics;
    if (!analytics || !analytics.provider)
        return null;
    if (analytics.provider === "ga" && analytics.id) {
        return (_jsxs(_Fragment, { children: [_jsx("script", { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${analytics.id}` }), _jsx("script", { dangerouslySetInnerHTML: {
                        __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${analytics.id}');`,
                    } })] }));
    }
    return null;
}
