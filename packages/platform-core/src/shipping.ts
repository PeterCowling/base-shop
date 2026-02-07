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
import { getTrackingStatus as getDhlTrackingStatus } from "./shipping/dhl";
import { getTrackingStatus as getUpsTrackingStatus } from "./shipping/ups";

export type Carrier = "ups" | "dhl";

export interface TrackingStatus {
  // keep this deliberately wide to satisfy all current callsites
  [key: string]: unknown;
}

export async function getTrackingStatus(arg: { provider: Carrier; trackingNumber: string }): Promise<TrackingStatus> {
  const { provider, trackingNumber } = arg;
  if (provider === "ups") {
    return getUpsTrackingStatus(trackingNumber);
  }
  if (provider === "dhl") {
    return getDhlTrackingStatus(trackingNumber);
  }
  return { status: "unknown", provider, trackingNumber };
}
