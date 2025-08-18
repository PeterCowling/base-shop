export type Carrier = "ups" | "dhl";

export interface TrackingStatus {
  // keep this deliberately wide to satisfy all current callsites
  [key: string]: any;
}

export async function getTrackingStatus(arg: { provider: Carrier; trackingNumber: string }): Promise<TrackingStatus> {
  // TODO: real provider implementations
  return { status: "unknown", provider: arg.provider, trackingNumber: arg.trackingNumber };
}
