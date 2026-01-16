/* eslint-disable security/detect-non-literal-fs-filename -- CMS-0001 [ttl=2026-12-31] test helpers write to temp paths */
import fs from "node:fs/promises";
import path from "path";
import { withTempRepo, mockSessionAndEmail } from "@acme/test-utils";

describe("inventory history route", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("returns inflow and adjustment history for a sku + variant", async () => {
    await withTempRepo(async (dir) => {
      const shopDir = path.join(dir, "data", "shops", "test");
      await fs.mkdir(shopDir, { recursive: true });
      const event = {
        id: "evt1",
        idempotencyKey: "key-1",
        shop: "test",
        receivedAt: "2024-01-01T00:00:00.000Z",
        note: "init",
        items: [
          {
            sku: "sku-1",
            productId: "prod-1",
            quantity: 5,
            variantAttributes: { size: "M" },
          },
        ],
        report: {
          created: 1,
          updated: 0,
          items: [
            {
              sku: "sku-1",
              productId: "prod-1",
              variantAttributes: { size: "M" },
              delta: 5,
              previousQuantity: 0,
              nextQuantity: 5,
            },
          ],
        },
      };
      await fs.writeFile(path.join(shopDir, "stock-inflows.jsonl"), `${JSON.stringify(event)}\n`, "utf8");
      const adjEvent = {
        id: "adj1",
        idempotencyKey: "key-2",
        shop: "test",
        adjustedAt: "2024-01-02T00:00:00.000Z",
        note: "fix",
        items: [
          {
            sku: "sku-1",
            productId: "prod-1",
            quantity: -2,
            variantAttributes: { size: "M" },
            reason: "correction",
          },
        ],
        report: {
          created: 0,
          updated: 1,
          items: [
            {
              sku: "sku-1",
              productId: "prod-1",
              variantAttributes: { size: "M" },
              delta: -2,
              previousQuantity: 5,
              nextQuantity: 3,
              reason: "correction",
            },
          ],
        },
      };
      await fs.writeFile(path.join(shopDir, "stock-adjustments.jsonl"), `${JSON.stringify(adjEvent)}\n`, "utf8");
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/history/route");
      const params = new URLSearchParams();
      params.set("sku", "sku-1");
      params.set("variant", JSON.stringify({ size: "M" }));
      const req = new Request(`http://test?${params.toString()}`);
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.items).toHaveLength(2);
      expect(json.items[0]).toMatchObject({
        delta: -2,
        previousQuantity: 5,
        nextQuantity: 3,
        note: "fix",
        source: "adjustment",
      });
      expect(json.items[1]).toMatchObject({
        delta: 5,
        previousQuantity: 0,
        nextQuantity: 5,
        note: "init",
        source: "inflow",
      });
    });
  });

  it("requires inventory permission", async () => {
    const { __setMockSession } = require("next-auth") as { __setMockSession: (s: any) => void };
    __setMockSession({ user: { role: "viewer" } });
    const route = await import("../src/app/api/data/[shop]/inventory/history/route");
    const req = new Request("http://test?sku=sku-1");
    const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
    expect(res.status).toBe(403);
  });
});
