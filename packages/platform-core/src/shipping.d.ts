export type Carrier = "ups" | "dhl";
export interface TrackingStatus {
    [key: string]: any;
}
export declare function getTrackingStatus(arg: {
    provider: Carrier;
    trackingNumber: string;
}): Promise<TrackingStatus>;
