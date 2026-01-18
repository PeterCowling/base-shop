"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingStatus = getTrackingStatus;
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
const ups_1 = require("./shipping/ups");
const dhl_1 = require("./shipping/dhl");
async function getTrackingStatus(arg) {
    const { provider, trackingNumber } = arg;
    if (provider === "ups") {
        return (0, ups_1.getTrackingStatus)(trackingNumber);
    }
    if (provider === "dhl") {
        return (0, dhl_1.getTrackingStatus)(trackingNumber);
    }
    return { status: "unknown", provider, trackingNumber };
}
