"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingStatus = getTrackingStatus;
async function getTrackingStatus(tracking) {
    try {
        const res = await fetch(`https://api.dhl.com/track/shipments?trackingNumber=${tracking}`);
        if (!res.ok) {
            return { status: null, steps: [] };
        }
        const data = await res.json();
        const status = data?.shipments?.[0]?.status?.status;
        const normalized = typeof status === "string" ? status : null;
        return {
            status: normalized,
            steps: normalized ? [{ label: normalized, complete: true }] : [],
        };
    }
    catch {
        return { status: null, steps: [] };
    }
}
