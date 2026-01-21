import { mockSessionAndEmail,withTempRepo } from "@acme/test-utils";

describe("inventory import route - csv", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("imports inventory from csv", async () => {
    await withTempRepo(async () => {
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const csv =
        "sku,productId,variant.size,variant.color,quantity,lowStockThreshold\n" +
        "a,a,M,red,1,1\n" +
        "b,b,L,blue,2,1";
      const file = {
        name: "inv.csv",
        type: "text/csv",
        text: async () => csv,
      };
      const req = {
        formData: async () => ({ get: () => file }),
      } as any;
      const res = await route.POST(req, { params: Promise.resolve({ shop: "test" }) });
      const text = await res.text();
      if (res.status !== 200) {
        console.error("import csv failed", res.status, text);
      }
      expect(res.status).toBe(200);
      const json = JSON.parse(text);
      expect(json.items).toEqual([
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
      ]);
      expect(json.items).toHaveLength(2);
    });
  });

  it("rejects invalid csv content", async () => {
    await withTempRepo(async () => {
      mockSessionAndEmail();
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const csv =
        "sku,productId,variant.size,variant.color,quantity,lowStockThreshold\n" +
        "a,a,M,red,-1,1";
      const file = {
        name: "inv.csv",
        type: "text/csv",
        text: async () => csv,
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
