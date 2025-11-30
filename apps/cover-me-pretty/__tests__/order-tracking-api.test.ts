// apps/cover-me-pretty/__tests__/order-tracking-api.test.ts
jest.mock("@platform-core/repositories/settings.server", () => ({
  __esModule: true,
  getShopSettings: jest.fn(),
}));

import { getShopSettings } from "@platform-core/repositories/settings.server";
import { NextResponse } from "next/server";
import { GET } from "../src/app/api/orders/[id]/tracking/route";

function makeRequest() {
  return new Request("http://example.com/api/orders/1/tracking");
}

afterEach(() => {
  jest.clearAllMocks();
});

test("returns steps when providers have events", async () => {
  (getShopSettings as jest.Mock).mockResolvedValue({ trackingProviders: ["ups"] });
  const res = await GET(makeRequest(), { params: { id: "1" } });
  expect(res).toBeInstanceOf(NextResponse);
  expect(res.status).toBe(200);
  await expect(res.json()).resolves.toEqual({
    steps: [
      { label: "Shipment picked up", date: "2024-01-01", complete: true },
      { label: "Out for delivery", complete: false },
    ],
  });
});

test("returns 404 with empty steps when no providers configured", async () => {
  (getShopSettings as jest.Mock).mockResolvedValue({ trackingProviders: [] });
  const res = await GET(makeRequest(), { params: { id: "1" } });
  expect(res).toBeInstanceOf(NextResponse);
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toEqual({ steps: [] });
});

test("returns 404 with empty steps when providers unknown", async () => {
  (getShopSettings as jest.Mock).mockResolvedValue({ trackingProviders: ["fedex"] });
  const res = await GET(makeRequest(), { params: { id: "1" } });
  expect(res).toBeInstanceOf(NextResponse);
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toEqual({ steps: [] });
});
