import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

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
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const items = [{ sku: "a", quantity: 1 }];
      const file = {
        name: "inv.json",
        type: "application/json",
        text: async () => JSON.stringify(items),
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
      expect(json.items).toEqual(items);
      const buf = await fs.readFile(path.join(dir, "data", "shops", "test", "inventory.json"), "utf8");
      expect(JSON.parse(buf)).toEqual(items);
    });
  });

  it("imports inventory from csv", async () => {
    await withTempRepo(async () => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      const route = await import("../src/app/api/data/[shop]/inventory/import/route");
      const csv = "sku,quantity\na,1\nb,2";
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
        { sku: "a", quantity: 1 },
        { sku: "b", quantity: 2 },
      ]);
    });
  });

  it("exports inventory as csv", async () => {
    await withTempRepo(async (dir) => {
      const items = [
        { sku: "a", quantity: 1 },
        { sku: "b", quantity: 2 },
      ];
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8"
      );
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=csv");
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.headers.get("content-type")).toContain("text/csv");
      const text = await res.text();
      expect(text).toContain("sku,quantity");
      expect(text).toContain("a,1");
    });
  });

  it("exports inventory as json", async () => {
    await withTempRepo(async (dir) => {
      const items = [
        { sku: "a", quantity: 1 },
        { sku: "b", quantity: 2 },
      ];
      await fs.writeFile(
        path.join(dir, "data", "shops", "test", "inventory.json"),
        JSON.stringify(items),
        "utf8"
      );
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      const route = await import("../src/app/api/data/[shop]/inventory/export/route");
      const req = new Request("http://test?format=json");
      const res = await route.GET(req as any, { params: Promise.resolve({ shop: "test" }) });
      expect(res.headers.get("content-type")).toContain("application/json");
      const json = await res.json();
      expect(json).toEqual(items);
    });
  });
});
