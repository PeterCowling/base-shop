import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.setTimeout(20000);

// Polyfill Response.json when missing
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  process.env.NEXTAUTH_SECRET = "test";
  process.env.SESSION_SECRET = "test";
  process.env.CART_COOKIE_SECRET = "test-cart-secret";
  process.env.STRIPE_SECRET_KEY = "sk";
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.SKIP_STOCK_ALERT = "1";
  process.env.CMS_SPACE_URL = "http://example.com";
  process.env.CMS_ACCESS_TOKEN = "token";
  process.env.SANITY_API_VERSION = "2024-01-01";
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

// Polyfill setImmediate used by fast-csv in the test environment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
  setTimeout(fn, 0, ...args);

describe("inventory import/export routes", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("imports inventory from json", async () => {
    await withTempRepo(async (dir) => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
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
      const buf = await fs.readFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        "utf8"
      );
      expect(JSON.parse(buf)).toEqual(expected);
    });
  });

  it("imports inventory from csv", async () => {
    await withTempRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
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

  it("rejects negative values during import", async () => {
    await withTempRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
      const route = await import(
        "../src/app/api/data/[shop]/inventory/import/route"
      );
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

  it("rejects invalid csv content", async () => {
    await withTempRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
      const route = await import(
        "../src/app/api/data/[shop]/inventory/import/route"
      );
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
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8"
      );
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=csv");
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain(
        "sku,productId,variant.size,variant.color,quantity,lowStockThreshold"
      );
      expect(text).toContain("a,a,M,red,1,1");
    });
  });

  it("exports empty inventory as csv", async () => {
    await withTempRepo(async (dir) => {
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        "[]",
        "utf8",
      );
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
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
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8"
      );
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@acme/email", () => ({ sendEmail: jest.fn() }));
      Object.assign(process.env, {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      });
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
});
