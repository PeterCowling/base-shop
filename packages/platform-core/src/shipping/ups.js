"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReturnLabel = createReturnLabel;
exports.getStatus = getStatus;
exports.getTrackingStatus = getTrackingStatus;
const shipping_1 = require("@acme/config/env/shipping");
async function createReturnLabel(_sessionId) {
    // Generate a deterministic 10-digit tracking suffix. `Math.random()` may
    // omit trailing zeros when converted to a string, so ensure we always pad to
    // ten digits so tests using a fixed random value remain stable.
    const randomDigits = Math.floor(Math.random() * 1e10)
        .toString()
        .padStart(10, "0");
    const fallback = `1Z${randomDigits}`;
    const fallbackUrl = `https://www.ups.com/track?loc=en_US&tracknum=${fallback}`;
    const apiKey = shipping_1.shippingEnv.UPS_KEY;
    if (!apiKey) {
        return { trackingNumber: fallback, labelUrl: fallbackUrl };
    }
    try {
        const res = await fetch("https://onlinetools.ups.com/ship/v1/shipments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ returnService: true }),
        });
        if (!res.ok) {
            return { trackingNumber: fallback, labelUrl: fallbackUrl };
        }
        const data = await res.json();
        const trackingNumber = data?.ShipmentResults?.PackageResults?.TrackingNumber ?? fallback;
        const labelUrl = data?.ShipmentResults?.PackageResults?.LabelURL ?? fallbackUrl;
        return { trackingNumber, labelUrl };
    }
    catch {
        return { trackingNumber: fallback, labelUrl: fallbackUrl };
    }
}
async function getStatus(tracking) {
    try {
        const res = await fetch(`https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${tracking}`);
        const data = await res.json();
        return data?.trackDetails?.[0]?.packageStatus?.statusType ?? null;
    }
    catch {
        return null;
    }
}
async function getTrackingStatus(tracking) {
    const status = await getStatus(tracking);
    return {
        status,
        steps: status ? [{ label: status, complete: true }] : [],
    };
}
