export declare const metadata: {
    title: string;
};
/**
 * Next 15 delivers `params` as a Promise, and `cookies()` is async in
 * the edge runtime.  Await both.
 */
export default function CheckoutPage({ params, }: {
    params: Promise<{
        lang?: string;
    }>;
}): Promise<import("react/jsx-runtime").JSX.Element>;
