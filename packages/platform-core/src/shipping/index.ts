// packages/platform-core/src/shipping/index.ts

import { shippingEnv } from "@acme/config/env/shipping";

import { createReturnLabel, getStatus } from "./ups";

export interface ShippingRate {
  rate: number;
  surcharge?: number;
  serviceLabel?: string;
}

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
export async function getShippingRate({
  provider,
  fromPostalCode,
  toPostalCode,
  weight,
  region,
  window,
  carrier,
  premierDelivery,
}: ShippingRateRequest): Promise<ShippingRate> {
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
  const apiKey = (shippingEnv as Record<string, string | undefined>)[
    `${provider.toUpperCase()}_KEY`
  ];
  if (!apiKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
  }

  const url =
    provider === "ups"
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
export async function getTrackingStatus({
  provider,
  trackingNumber,
}: TrackingStatusRequest): Promise<TrackingStatus> {
  const url =
    provider === "dhl"
      ? `https://api.dhl.com/track/shipments?trackingNumber=${trackingNumber}`
      : `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${trackingNumber}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { status: null, steps: [] };
    }
    const data = await res.json();
    const rawStatus =
      provider === "dhl"
        ? data?.shipments?.[0]?.status?.status
        : data?.trackDetails?.[0]?.packageStatus?.statusType;
    const status = typeof rawStatus === "string" ? rawStatus : null;
    return {
      status,
      steps: status ? [{ label: status, complete: true }] : [],
    };
  } catch {
    return { status: null, steps: [] }; // i18n-exempt -- CORE-1011 default fallback
  }
}

export {
  createReturnLabel,
  createReturnLabel as createUpsReturnLabel,
  getStatus as getUpsStatus,
};
