// packages/platform-core/src/shipping/index.ts

import { shippingEnv } from "@acme/config/env/shipping";

export interface ShippingRateRequest {
  provider: "ups" | "dhl" | "premier-shipping";
  fromPostalCode: string;
  toPostalCode: string;
  weight: number;
  region?: string;
  window?: string;
  premierDelivery?: { regions: string[]; windows: string[] };
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
  premierDelivery,
}: ShippingRateRequest): Promise<unknown> {
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
    return { rate: 0 };
  }

  if (region || window) {
    if (!premierDelivery) {
      throw new Error("Premier delivery not configured");
    }
    if (!region || !premierDelivery.regions.includes(region)) {
      throw new Error("Region not eligible for premier delivery");
    }
    if (!window || !premierDelivery.windows.includes(window)) {
      throw new Error("Invalid delivery window");
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
    throw new Error(`Failed to fetch rate from ${provider}`);
  }

  return res.json();
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

export interface ReturnLabel {
  trackingNumber: string;
  labelUrl: string;
}

export interface ReturnLabelRequest {
  provider: "ups" | "dhl";
}

/**
 * Create a return label for the given provider.
 * Supports UPS out of the box and can be extended for other carriers.
 */
export async function createReturnLabel({
  provider,
}: ReturnLabelRequest): Promise<ReturnLabel> {
  if (provider !== "ups") {
    throw new Error("Unsupported provider");
  }
  const apiKey = shippingEnv.UPS_KEY;
  let trackingNumber = `1Z${Math.random().toString().slice(2, 12)}`;
  let labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  if (apiKey) {
    try {
      const res = await fetch(
        "https://onlinetools.ups.com/ship/v1/shipments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      trackingNumber =
        data?.shipmentResponse?.shipmentResults?.shipmentIdentificationNumber ||
        trackingNumber;
      const img =
        data?.shipmentResponse?.shipmentResults?.packageResults?.[0]?.labelImage
          ?.graphicImage;
      if (img) {
        labelUrl = `data:application/pdf;base64,${img}`;
      }
    } catch {
      /* fall back to mock tracking */
    }
  }
  return { trackingNumber, labelUrl };
}
