export type Carrier = "ups" | "dhl";

export interface TrackingStatus {
  // keep this deliberately wide to satisfy all current callsites
  [key: string]: unknown;
}

/**
 * Fetches tracking information for a shipment.
 *
 * @param arg - Object containing the shipping `provider` and its `trackingNumber`.
 * @returns A promise that resolves with the tracking status.
 *
 * @example
 * ```ts
 * const status = await getTrackingStatus({
 *   provider: "ups",
 *   trackingNumber: "1Z12345"
 * });
 * console.log(status.status);
 * ```
 */
export async function getTrackingStatus(arg: { provider: Carrier; trackingNumber: string }): Promise<TrackingStatus> {
  // TODO: real provider implementations
  return { status: "unknown", provider: arg.provider, trackingNumber: arg.trackingNumber };
}
