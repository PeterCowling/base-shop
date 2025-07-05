// src/components/checkout/CheckoutForm.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslations } from "@/i18n/Translations";
import { env } from "@config/env";
import { Elements, PaymentElement, useElements, useStripe, } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
const stripePromise = loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export default function CheckoutForm({ locale }) {
    const [clientSecret, setClientSecret] = useState();
    const defaultDate = (() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    })();
    const form = useForm({
        defaultValues: { returnDate: defaultDate },
    });
    const returnDate = form.watch("returnDate");
    /* --- create session on mount or when returnDate changes --- */
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ returnDate }),
            });
            const { clientSecret } = (await res.json());
            setClientSecret(clientSecret);
        })();
    }, [returnDate]);
    if (!clientSecret)
        return _jsx("p", { children: "Loading payment form\u2026" });
    return (_jsx(Elements, { stripe: stripePromise, 
        /*  👇 cast locale to StripeElementLocale to satisfy TS  */
        options: { clientSecret, locale: locale }, children: _jsx(PaymentForm, { form: form, locale: locale }) }, clientSecret));
}
/* ---------- inner form ---------- */
function PaymentForm({ form, locale, }) {
    const { register, handleSubmit } = form;
    const stripe = useStripe();
    const elements = useElements();
    const t = useTranslations();
    const router = useRouter();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState();
    const onSubmit = handleSubmit(async () => {
        if (!stripe || !elements)
            return;
        setProcessing(true);
        const { error } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
                return_url: `${window.location.origin}/${locale}/success`,
            },
        });
        if (error) {
            setError(error.message ?? "Payment failed");
            setProcessing(false);
            router.push(`/${locale}/cancelled`);
        }
        else {
            router.push(`/${locale}/success`);
        }
    });
    return (_jsxs("form", { onSubmit: onSubmit, className: "space-y-6", children: [_jsxs("label", { className: "block text-sm", children: [t("checkout.return"), _jsx("input", { type: "date", ...register("returnDate"), className: "block w-full border px-2 py-1" })] }), _jsx(PaymentElement, {}), error && _jsx("p", { className: "text-sm text-red-600", children: error }), _jsx("button", { type: "submit", disabled: !stripe || processing, className: "w-full rounded bg-gray-900 py-2 text-white disabled:opacity-50", children: processing ? t("checkout.processing") : t("checkout.pay") })] }));
}
