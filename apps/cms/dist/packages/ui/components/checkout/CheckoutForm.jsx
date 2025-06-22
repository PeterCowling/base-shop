// src/components/checkout/CheckoutForm.tsx
"use client";
import { Elements, PaymentElement, useElements, useStripe, } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
export default function CheckoutForm({ locale }) {
    const [clientSecret, setClientSecret] = useState();
    /* --- create session on mount --- */
    useEffect(() => {
        (async () => {
            const res = await fetch("/api/checkout-session", { method: "POST" });
            const { id } = (await res.json());
            setClientSecret(id);
        })();
    }, []);
    if (!clientSecret)
        return <p>Loading payment form…</p>;
    return (<Elements stripe={stripePromise} 
    /*  👇 cast locale to StripeElementLocale to satisfy TS  */
    options={{ clientSecret, locale: locale }} key={clientSecret} // re-mount if locale changes
    >
      <PaymentForm />
    </Elements>);
}
/* ---------- inner form ---------- */
function PaymentForm() {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState();
    async function handleSubmit(e) {
        e.preventDefault();
        if (!stripe || !elements)
            return;
        setProcessing(true);
        const { error } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });
        if (error) {
            setError(error.message ?? "Payment failed");
            setProcessing(false);
        }
    }
    return (<form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={!stripe || processing} className="w-full bg-gray-900 text-white py-2 rounded disabled:opacity-50">
        {processing ? "Processing…" : "Pay now"}
      </button>
    </form>);
}
