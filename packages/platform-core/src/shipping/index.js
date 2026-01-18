"use strict";
// packages/platform-core/src/shipping/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpsStatus = exports.createUpsReturnLabel = exports.createReturnLabel = void 0;
exports.getShippingRate = getShippingRate;
exports.getTrackingStatus = getTrackingStatus;
const shipping_1 = require("@acme/config/env/shipping");
const ups_1 = require("./ups");
Object.defineProperty(exports, "createReturnLabel", { enumerable: true, get: function () { return ups_1.createReturnLabel; } });
Object.defineProperty(exports, "createUpsReturnLabel", { enumerable: true, get: function () { return ups_1.createReturnLabel; } });
Object.defineProperty(exports, "getUpsStatus", { enumerable: true, get: function () { return ups_1.getStatus; } });
/**
 * Fetch a shipping rate from the configured provider.
 * The underlying provider API is called using the respective API key.
 */
async function getShippingRate({ provider, fromPostalCode, toPostalCode, weight, region, window, carrier, premierDelivery, }) {
    if (provider === "premier-shipping") {
        if (!premierDelivery) {
            throw new Error("Premier delivery not configured"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (!region || !premierDelivery.regions.includes(region)) {
            throw new Error("Region not eligible for premier delivery"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (!window || !premierDelivery.windows.includes(window)) {
            throw new Error("Invalid delivery window"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (carrier && premierDelivery.carriers && !premierDelivery.carriers.includes(carrier)) {
            throw new Error("Carrier not supported"); // i18n-exempt -- CORE-1011 internal error message
        }
        return {
            rate: 0,
            surcharge: premierDelivery.surcharge ?? 0,
            serviceLabel: premierDelivery.serviceLabel ?? "Premier Delivery", // i18n-exempt -- CORE-1011 default label
        };
    }
    if (region || window || carrier) {
        if (!premierDelivery) {
            throw new Error("Premier delivery not configured"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (!region || !premierDelivery.regions.includes(region)) {
            throw new Error("Region not eligible for premier delivery"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (!window || !premierDelivery.windows.includes(window)) {
            throw new Error("Invalid delivery window"); // i18n-exempt -- CORE-1011 internal error message
        }
        if (carrier && premierDelivery.carriers && !premierDelivery.carriers.includes(carrier)) {
            throw new Error("Carrier not supported"); // i18n-exempt -- CORE-1011 internal error message
        }
    }
    const apiKey = shipping_1.shippingEnv[`${provider.toUpperCase()}_KEY`];
    if (!apiKey) {
        throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
    }
    const url = provider === "ups"
        ? "https://onlinetools.ups.com/ship/v1/rating/Rate"
        : "https://api.dhl.com/rates";
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ fromPostalCode, toPostalCode, weight }),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch rate from ${provider}`); // i18n-exempt -- CORE-1011 internal error message
    }
    const data = await res.json();
    return {
        rate: data.rate,
        surcharge: data.surcharge,
        serviceLabel: data.serviceLabel,
    };
}
/**
 * Fetch the tracking status for a shipment.
 * Implementations call the provider APIs but gracefully fall back on failure.
 */
async function getTrackingStatus({ provider, trackingNumber, }) {
    const url = provider === "dhl"
        ? `https://api.dhl.com/track/shipments?trackingNumber=${trackingNumber}`
        : `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${trackingNumber}`;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return { status: null, steps: [] };
        }
        const data = await res.json();
        const rawStatus = provider === "dhl"
            ? data?.shipments?.[0]?.status?.status
            : data?.trackDetails?.[0]?.packageStatus?.statusType;
        const status = typeof rawStatus === "string" ? rawStatus : null;
        return {
            status,
            steps: status ? [{ label: status, complete: true }] : [],
        };
    }
    catch {
        return { status: null, steps: [] }; // i18n-exempt -- CORE-1011 default fallback
    }
}
