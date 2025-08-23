export interface OrdersPageProps {
    /** ID of the current shop for fetching orders */
    shopId: string;
    /** Optional heading override */
    title?: string;
    /** Destination to return to after login */
    callbackUrl?: string;
    /** Whether returns are enabled */
    returnsEnabled?: boolean;
    /** Optional return policy link */
    returnPolicyUrl?: string;
    /** Whether tracking is enabled for this shop */
    trackingEnabled?: boolean;
    /** List of carriers supported for tracking */
    trackingProviders?: string[];
}
export declare const metadata: {
    title: string;
};
export default function OrdersPage({ shopId, title, callbackUrl, returnsEnabled, returnPolicyUrl, trackingEnabled, trackingProviders, }: OrdersPageProps): Promise<import("react/jsx-runtime").JSX.Element>;
//# sourceMappingURL=Orders.d.ts.map