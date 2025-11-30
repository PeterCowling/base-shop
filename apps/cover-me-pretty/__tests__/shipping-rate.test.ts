// apps/cover-me-pretty/__tests__/shipping-rate.test.ts
jest.mock("@platform-core/shipping/index", () => ({
  __esModule: true,
  getShippingRate: jest.fn(),
}));

jest.mock("@platform-core/repositories/settings.server", () => ({
  __esModule: true,
  getShopSettings: jest.fn().mockResolvedValue({}),
}));

import { getShippingRate } from "@platform-core/shipping/index";
import { getShopSettings } from "@platform-core/repositories/settings.server";
import { POST } from "../src/app/api/shipping-rate/route";
import type { ShopSettings } from "@acme/types";

type ShippingRateBody = {
  provider: "ups" | "dhl" | "premier-shipping";
  fromPostalCode: string;
  toPostalCode: string;
  weight: number;
  region?: string;
  window?: string;
  carrier?: string;
};

function makeRequest(body: ShippingRateBody) {
  return new Request("http://example.com/api/shipping-rate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => jest.clearAllMocks());

test("returns shipping rate for valid request", async () => {
  (getShippingRate as jest.Mock).mockResolvedValue({ rate: 42 });
  const res = await POST(
    makeRequest({
      provider: "dhl",
      fromPostalCode: "1000",
      toPostalCode: "2000",
      weight: 1,
    }),
  );
  expect(getShippingRate).toHaveBeenCalledWith({
    provider: "dhl",
    fromPostalCode: "1000",
    toPostalCode: "2000",
    weight: 1,
    region: undefined,
    window: undefined,
    carrier: undefined,
    premierDelivery: undefined,
  });
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({ rate: 42 });
});

test("validates required fields for premier-shipping", async () => {
  const res = await POST(
    makeRequest({
      provider: "premier-shipping",
      fromPostalCode: "1000",
      toPostalCode: "2000",
      weight: 1,
    }),
  );
  expect(res.status).toBe(400);
  expect(getShippingRate).not.toHaveBeenCalled();
});

test("returns 500 when provider throws", async () => {
  (getShippingRate as jest.Mock).mockRejectedValueOnce(new Error("oops"));
  const res = await POST(
    makeRequest({
      provider: "dhl",
      fromPostalCode: "1",
      toPostalCode: "2",
      weight: 1,
    }),
  );
  expect(res.status).toBe(500);
  await expect(res.json()).resolves.toEqual({ error: "oops" });
});

test("uses premierDelivery when enabled and region allowed", async () => {
  const settings: Pick<ShopSettings, "luxuryFeatures" | "premierDelivery"> = {
    luxuryFeatures: { premierDelivery: true },
    premierDelivery: { regions: ["EU", "US"] },
  };
  (getShopSettings as jest.Mock).mockResolvedValueOnce(settings);
  (getShippingRate as jest.Mock).mockResolvedValue({ rate: 99 });
  const res = await POST(
    makeRequest({
      provider: "premier-shipping",
      fromPostalCode: "1000",
      toPostalCode: "2000",
      weight: 2,
      region: "EU",
      window: "AM",
      carrier: "X",
    }),
  );
  expect(res.status).toBe(200);
  expect(getShippingRate).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "premier-shipping", premierDelivery: settings.premierDelivery })
  );
});

test("falls back to dhl when region not allowed", async () => {
  const settings: Pick<ShopSettings, "luxuryFeatures" | "premierDelivery"> = {
    luxuryFeatures: { premierDelivery: true },
    premierDelivery: { regions: ["US"] },
  };
  (getShopSettings as jest.Mock).mockResolvedValueOnce(settings);
  (getShippingRate as jest.Mock).mockResolvedValue({ rate: 55 });
  const res = await POST(
    makeRequest({
      provider: "premier-shipping",
      fromPostalCode: "1000",
      toPostalCode: "2000",
      weight: 2,
      region: "EU",
      window: "AM",
      carrier: "X",
    }),
  );
  expect(res.status).toBe(200);
  expect(getShippingRate).toHaveBeenCalledWith(
    expect.objectContaining({ provider: "dhl", premierDelivery: undefined })
  );
});
