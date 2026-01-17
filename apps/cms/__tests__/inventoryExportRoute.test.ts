import fs from "node:fs/promises";
import path from "node:path";
import { flattenInventoryItem } from "@acme/platform-core/utils/inventory";
import { withTempRepo, mockSessionAndEmail } from "@acme/test-utils";

describe("inventory export route", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("exports inventory as csv", async () => {
    await withTempRepo(async (dir) => {
      const items = [
        {
          sku: "a",
          productId: "a",
          variantAttributes: { size: "M", color: "red" },
          quantity: 1,
          lowStockThreshold: 1,
        },
        {
          sku: "b",
          productId: "b",
          variantAttributes: { size: "L", color: "blue" },
          quantity: 2,
          lowStockThreshold: 1,
        },
      ];
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201: test writes fixture JSON to a computed temp path
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8",
      );
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=csv");
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain(
        "sku,productId,variant.size,variant.color,quantity,lowStockThreshold",
      );
      expect(text).toContain("a,a,M,red,1,1");
    });
  });

  it("exports empty inventory as csv", async () => {
    await withTempRepo(async (dir) => {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201: test writes empty fixture JSON under sandboxed temp dir
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        "[]",
        "utf8",
      );
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=csv");
      const res = await route.GET(req as any, {
        params: Promise.resolve({ shop: "test" }),
      });
      expect(res.headers.get("content-type")).toContain("text/csv");
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("");
    });
  });

  it("exports inventory as json", async () => {
    await withTempRepo(async (dir) => {
      const items = [
        {
          sku: "a",
          productId: "a",
          variantAttributes: { size: "M", color: "red" },
          quantity: 1,
          lowStockThreshold: 1,
        },
        {
          sku: "b",
          productId: "b",
          variantAttributes: { size: "L", color: "blue" },
          quantity: 2,
          lowStockThreshold: 1,
        },
      ];
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201: test writes fixture JSON to a computed temp path
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8",
      );
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=json");
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.headers.get("content-type")).toContain("application/json");
      const json = await res.json();
      expect(json).toEqual([
        {
          sku: "a",
          productId: "a",
          "variant.size": "M",
          "variant.color": "red",
          quantity: 1,
          lowStockThreshold: 1,
        },
        {
          sku: "b",
          productId: "b",
          "variant.size": "L",
          "variant.color": "blue",
          quantity: 2,
          lowStockThreshold: 1,
        },
      ]);
    });
  });

  it.each(["demo", "test"])(
    "exports %s shop inventory from fixtures",
    async (shop) => {
      process.env.INVENTORY_BACKEND = "json";
      process.env.DATA_ROOT = path.join(__dirname, "data", "shops");
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=json");
      const res = await route.GET(req as any, {
        params: Promise.resolve({ shop }),
      });
      expect(res.headers.get("content-type")).toContain("application/json");
      expect(res.status).toBe(200);
      const json = await res.json();
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- TEST-201: test reads fixture from repo-relative DATA_ROOT
      const buf = await fs.readFile(
        path.join(process.env.DATA_ROOT!, shop, "inventory.json"),
        "utf8",
      );
      const items = JSON.parse(buf);
      const expected = items.map((i: any) => flattenInventoryItem(i));
      expect(json).toEqual(expected);
    },
  );
});
