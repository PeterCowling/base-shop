export interface ShippingRateRequest {
    provider: "ups" | "dhl" | "premier-shipping";
    fromPostalCode: string;
    toPostalCode: string;
    weight: number;
    region?: string;
    window?: string;
    carrier?: string;
    premierDelivery?: {
        regions: string[];
        windows: string[];
        carriers?: string[];
        surcharge?: number;
        serviceLabel?: string;
    };
}
/**
 * Fetch a shipping rate from the configured provider.
 * The underlying provider API is called using the respective API key.
 */
export declare function getShippingRate({ provider, fromPostalCode, toPostalCode, weight, region, window, carrier, premierDelivery, }: ShippingRateRequest): Promise<unknown>;
export interface TrackingStatusRequest {
    provider: "ups" | "dhl";
    trackingNumber: string;
}
export interface TrackingStep {
    label: string;
    date?: string;
    complete?: boolean;
}
export interface TrackingStatus {
    status: string | null;
    steps: TrackingStep[];
}
/**
 * Fetch the tracking status for a shipment.
 * Implementations call the provider APIs but gracefully fall back on failure.
 */
export declare function getTrackingStatus({ provider, trackingNumber, }: TrackingStatusRequest): Promise<TrackingStatus>;
export { createReturnLabel as createUpsReturnLabel, getStatus as getUpsStatus } from "./ups";
