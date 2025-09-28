import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo, mockSessionAndEmail } from "@acme/test-utils";

describe("inventory import route - json", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("imports inventory from json", async () => {
    await withTempRepo(async (dir) => {
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const flatItems = [
        {
          sku: "a",
          productId: "a",
          "variant.size": "M",
          "variant.color": "red",
          quantity: 1,
          lowStockThreshold: 1,
        },
      ];
      const expected = [
        {
          sku: "a",
          productId: "a",
          variantAttributes: { size: "M", color: "red" },
          quantity: 1,
          lowStockThreshold: 1,
        },
      ];
      const file = {
        name: "inv.json",
        type: "application/json",
        text: async () => JSON.stringify(flatItems),
      };
      const req = {
        formData: async () => ({ get: () => file }),
      } as any;
      const res = await route.POST(req, { params: Promise.resolve({ shop: "test" }) });
      const text = await res.text();
      if (res.status !== 200) {
        console.error("import json failed", res.status, text);
      }
      expect(res.status).toBe(200);
      const json = JSON.parse(text);
      expect(json.items).toEqual(expected);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201: test asserts JSON written to computed sandbox path
      const buf = await fs.readFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        "utf8",
      );
      expect(JSON.parse(buf)).toEqual(expected);
    });
  });

  it("rejects negative values during import", async () => {
    await withTempRepo(async () => {
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const file = {
        name: "inv.json",
        type: "application/json",
        text: async () =>
          JSON.stringify([
            {
              sku: "a",
              productId: "a",
              quantity: -1,
              lowStockThreshold: -1,
              variantAttributes: {},
            },
          ]),
      };
      const req = {
        formData: async () => ({ get: () => file }),
      } as any;
      const res = await route.POST(req, {
        params: Promise.resolve({ shop: "test" }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/greater than or equal to 0/);
    });
  });
});
