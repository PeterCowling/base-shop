import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe("product import repository", () => {
  const origDataRoot = process.env.DATA_ROOT;
  const origProductsBackend = process.env.PRODUCTS_BACKEND;
  const origSettingsBackend = process.env.SETTINGS_BACKEND;

  let tmpRoot: string | undefined;

  beforeEach(async () => {
    jest.resetModules();
    process.env.PRODUCTS_BACKEND = "json";
    process.env.SETTINGS_BACKEND = "json";
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "platform-core-product-import-"));
    process.env.DATA_ROOT = tmpRoot;
    await fs.mkdir(path.join(tmpRoot, "demo"), { recursive: true });
  });

  afterEach(async () => {
    jest.resetModules();

    if (origDataRoot === undefined) delete process.env.DATA_ROOT;
    else process.env.DATA_ROOT = origDataRoot;

    if (origProductsBackend === undefined) delete process.env.PRODUCTS_BACKEND;
    else process.env.PRODUCTS_BACKEND = origProductsBackend;

    if (origSettingsBackend === undefined) delete process.env.SETTINGS_BACKEND;
    else process.env.SETTINGS_BACKEND = origSettingsBackend;

    if (tmpRoot) {
      await fs.rm(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
    }
  });

  it("creates products and appends an import event", async () => {
    const { importProducts } = await import("../productImport.server");

    const idempotencyKey = randomUUID();
    const result = await importProducts("demo", {
      idempotencyKey,
      items: [
        {
          sku: "sku-1",
          title: { en: "Hat" },
          description: { en: "Warm" },
          price: 1999,
          currency: "EUR",
        },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.committed).toBe(true);
    expect(result.report).toMatchObject({
      shop: "demo",
      idempotencyKey,
      dryRun: false,
      created: 1,
      updated: 0,
      skipped: 0,
      errors: 0,
    });

    const productsPath = path.join(tmpRoot!, "demo", "products.json");
    const importsPath = path.join(tmpRoot!, "demo", "product-imports.jsonl");

    expect(await pathExists(productsPath)).toBe(true);
    expect(await pathExists(importsPath)).toBe(true);

    const catalogue = JSON.parse(await fs.readFile(productsPath, "utf8")) as any[];
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0]).toMatchObject({
      shop: "demo",
      sku: "sku-1",
      price: 1999,
      currency: "EUR",
      status: "draft",
      row_version: 1,
    });
    expect(catalogue[0].title).toMatchObject({ en: "Hat" });

    const lines = (await fs.readFile(importsPath, "utf8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]) as any;
    expect(event).toMatchObject({
      idempotencyKey,
      shop: "demo",
      report: { created: 1, updated: 0, errors: 0 },
    });
  });

  it("enforces idempotency and does not double-apply", async () => {
    const { importProducts } = await import("../productImport.server");

    const idempotencyKey = randomUUID();
    const first = await importProducts("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", title: { en: "Hat" }, price: 1000 }],
    });
    expect(first.ok).toBe(true);

    const second = await importProducts("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", title: { en: "Hat" }, price: 9999 }],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.duplicate).toBe(true);
    expect(second.committed).toBe(true);

    const productsPath = path.join(tmpRoot!, "demo", "products.json");
    const importsPath = path.join(tmpRoot!, "demo", "product-imports.jsonl");

    const catalogue = JSON.parse(await fs.readFile(productsPath, "utf8")) as any[];
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0]).toMatchObject({ sku: "sku-1", price: 1000, row_version: 1 });

    const lines = (await fs.readFile(importsPath, "utf8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(1);
  });

  it("updates an existing product and increments row_version", async () => {
    const { importProducts } = await import("../productImport.server");

    const created = await importProducts("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", title: { en: "Hat" }, price: 1000 }],
    });
    expect(created.ok).toBe(true);

    const updated = await importProducts("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", price: 2500 }],
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.duplicate).toBe(false);
    expect(updated.committed).toBe(true);
    expect(updated.report).toMatchObject({ created: 0, updated: 1, errors: 0 });

    const productsPath = path.join(tmpRoot!, "demo", "products.json");
    const catalogue = JSON.parse(await fs.readFile(productsPath, "utf8")) as any[];
    expect(catalogue).toHaveLength(1);
    expect(catalogue[0]).toMatchObject({ sku: "sku-1", price: 2500, row_version: 2 });
  });

  it("supports dryRun without writing products.json or the import log", async () => {
    const { importProducts } = await import("../productImport.server");

    const result = await importProducts("demo", {
      idempotencyKey: randomUUID(),
      dryRun: true,
      items: [{ sku: "sku-1", title: { en: "Hat" }, price: 1000 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.committed).toBe(false);
    expect(result.report.dryRun).toBe(true);
    expect(result.event.id).toBe("dry-run");

    const productsPath = path.join(tmpRoot!, "demo", "products.json");
    const importsPath = path.join(tmpRoot!, "demo", "product-imports.jsonl");
    expect(await pathExists(productsPath)).toBe(false);
    expect(await pathExists(importsPath)).toBe(false);
  });

  it("returns a report with errors and does not commit when rows are invalid", async () => {
    const { importProducts } = await import("../productImport.server");

    const result = await importProducts("demo", {
      idempotencyKey: randomUUID(),
      items: [{}],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.committed).toBe(false);
    expect(result.report.errors).toBeGreaterThan(0);

    const productsPath = path.join(tmpRoot!, "demo", "products.json");
    const importsPath = path.join(tmpRoot!, "demo", "product-imports.jsonl");
    expect(await pathExists(productsPath)).toBe(false);
    expect(await pathExists(importsPath)).toBe(false);
  });
});

