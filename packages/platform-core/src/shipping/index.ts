// packages/platform-core/src/shipping/index.ts

import { shippingEnv } from "@acme/config/env/shipping";

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
  toCountry?: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
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
  toCountry,
  dimensions,
  region,
  window,
  carrier,
  premierDelivery,
}: ShippingRateRequest): Promise<ShippingRate> {
  if (provider === "premier-shipping") {
    if (!premierDelivery) {
      throw new Error("Premier delivery not configured");
    }
    if (!region || !premierDelivery.regions.includes(region)) {
      throw new Error("Region not eligible for premier delivery");
    }
    if (!window || !premierDelivery.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    if (carrier && premierDelivery.carriers && !premierDelivery.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
    return {
      rate: 0,
      surcharge: premierDelivery.surcharge ?? 0,
      serviceLabel: premierDelivery.serviceLabel ?? "Premier Delivery",
    };
  }

  if (region || window || carrier) {
    if (!premierDelivery) {
      throw new Error("Premier delivery not configured");
    }
    if (!region || !premierDelivery.regions.includes(region)) {
      throw new Error("Region not eligible for premier delivery");
    }
    if (!window || !premierDelivery.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    if (carrier && premierDelivery.carriers && !premierDelivery.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
  }
  const env = shippingEnv as Record<string, any>;
  if (
    Array.isArray(env.ALLOWED_COUNTRIES) &&
    toCountry &&
    !env.ALLOWED_COUNTRIES.includes(toCountry.toUpperCase())
  ) {
    throw new Error("Shipping not available to destination");
  }

  if (
    typeof env.FREE_SHIPPING_THRESHOLD === "number" &&
    weight <= env.FREE_SHIPPING_THRESHOLD
  ) {
    return { rate: 0, surcharge: 0, serviceLabel: "Free Shipping" };
  }

  const apiKey = (env as Record<string, string | undefined>)[
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
    body: JSON.stringify({
      fromPostalCode,
      toPostalCode,
      weight,
      dimensions,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch rate from ${provider}`);
  }

  const data = await res.json();
  let rate = data.rate;
  const zoneMultipliers: Record<string, number> = {
    domestic: 1,
    eu: 1.5,
    international: 2,
  };
  if (
    typeof env.DEFAULT_SHIPPING_ZONE === "string" &&
    zoneMultipliers[env.DEFAULT_SHIPPING_ZONE]
  ) {
    rate *= zoneMultipliers[env.DEFAULT_SHIPPING_ZONE];
  }
  return {
    rate,
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
    const status =
      provider === "dhl"
        ? data?.shipments?.[0]?.status?.status
        : data?.trackDetails?.[0]?.packageStatus?.statusType;
    return {
      status: status ?? null,
      steps: status ? [{ label: status, complete: true }] : [],
    };
  } catch {
    return { status: null, steps: [] };
  }
}

export { createReturnLabel as createUpsReturnLabel, getStatus as getUpsStatus } from "./ups";
