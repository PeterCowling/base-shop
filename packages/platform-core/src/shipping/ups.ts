import { shippingEnv } from "@acme/config/env/shipping";
export async function createReturnLabel(
  _sessionId: string,
): Promise<{ trackingNumber: string; labelUrl: string }> {
  // Generate a deterministic 9-digit tracking suffix. `Math.random()` may omit
  // trailing zeros when converted to a string, so ensure we always pad to nine
  // digits so tests using a fixed random value remain stable.
  const randomDigits = Math.floor(Math.random() * 1e9)
    .toString()
    .padStart(9, "0");
  const fallback = `1Z${randomDigits}`;
  const fallbackUrl = `https://www.ups.com/track?loc=en_US&tracknum=${fallback}`;
  const apiKey = shippingEnv.UPS_KEY;
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
    const trackingNumber =
      data?.ShipmentResults?.PackageResults?.TrackingNumber ?? fallback;
    const labelUrl =
      data?.ShipmentResults?.PackageResults?.LabelURL ?? fallbackUrl;
    return { trackingNumber, labelUrl };
  } catch {
    return { trackingNumber: fallback, labelUrl: fallbackUrl };
  }
}

export async function getStatus(tracking: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.ups.com/track/api/Track/GetStatus?loc=en_US&tracknum=${tracking}`,
    );
    const data = await res.json();
    return data?.trackDetails?.[0]?.packageStatus?.statusType ?? null;
  } catch {
    return null;
  }
}
