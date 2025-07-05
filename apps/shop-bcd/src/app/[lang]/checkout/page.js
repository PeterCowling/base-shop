import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// apps/shop-bcd/src/app/[lang]/checkout/page.tsx
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/organisms/OrderSummary";
import { resolveLocale } from "@/i18n/locales";
import { CART_COOKIE, decodeCartCookie } from "@/lib/cartCookie";
import { cookies } from "next/headers";
export const metadata = {
    title: "Checkout · Base-Shop",
};
/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
export default async function CheckoutPage({ params, }) {
    /* ---------- await params ---------- */
    const { lang: rawLang } = await params;
    const lang = resolveLocale(rawLang);
    /* ---------- read cart from cookie ---------- */
    const cookieStore = await cookies(); // ← await here
    const cart = decodeCartCookie(cookieStore.get(CART_COOKIE)?.value);
    /* ---------- empty cart guard ---------- */
    if (!Object.keys(cart).length) {
        return _jsx("p", { className: "p-8 text-center", children: "Your cart is empty." });
    }
    /* ---------- render ---------- */
    return (_jsxs("div", { className: "mx-auto flex max-w-4xl flex-col gap-10 p-6", children: [_jsx(OrderSummary, {}), _jsx(CheckoutForm, { locale: lang })] }));
}
