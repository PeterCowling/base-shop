import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Localized<T> = Record<string, T>;

type CochlearfitProductRecord = {
  sku: string;
  title?: Localized<string>;
};

type VariantPricingRecord = {
  id: string;
  productSlug: string;
  size: "kids" | "adult";
  color: "sand" | "ocean" | "berry";
  price: number;
  currency: "USD";
  stripePriceId: string;
};

type InventoryRecord = {
  sku: string;
  quantity: number;
};

function repoRootFromHere(): string {
  // apps/cochlearfit-worker/src/__tests__ -> repo root
  return path.resolve(__dirname, "../../../..");
}

function runBundler(args: { dataDir: string; outFile: string }): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const repoRoot = repoRootFromHere();
  const bundlerPath = path.join(repoRoot, "scripts", "bundle-worker-catalog.ts");

  const result = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      bundlerPath,
      "--data-dir",
      args.dataDir,
      "--out",
      args.outFile,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
    },
  );

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function runImportCatalogLength(outFile: string): { status: number | null; stdout: string; stderr: string } {
  const url = pathToFileURL(outFile).href;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--import",
      "tsx",
      "-e",
      "const mod = await import(process.env.CATALOG_URL); console.log(mod.catalog.length);",
    ],
    {
      cwd: repoRootFromHere(),
      encoding: "utf8",
      env: { ...process.env, CATALOG_URL: url },
    },
  );

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  // Tests write into mkdtemp()-scoped directories; paths are controlled and not user input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

describe("bundle-worker-catalog (fixtures)", () => {
  test("rejects malformed Stripe Price IDs with a helpful error", async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), "cochlearfit-bundler-invalid-"));
    const outFile = path.join(dataDir, "worker-catalog.generated.ts");

    try {
      const products: CochlearfitProductRecord[] = [
        { sku: "P1", title: { en: "product.one" } },
      ];
      const variants: VariantPricingRecord[] = [
        {
          id: "V_BAD_PRICE",
          productSlug: "P1",
          size: "adult",
          color: "sand",
          price: 10,
          currency: "USD",
          stripePriceId: "not_price_prefix",
        },
      ];
      const inventory: InventoryRecord[] = [{ sku: "V_BAD_PRICE", quantity: 10 }];

      await Promise.all([
        writeJson(path.join(dataDir, "products.json"), products),
        writeJson(path.join(dataDir, "variants.json"), variants),
        writeJson(path.join(dataDir, "inventory.json"), inventory),
      ]);

      const result = runBundler({ dataDir, outFile });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("bundle-worker-catalog failed:");
      expect(result.stderr).toContain("V_BAD_PRICE");
      expect(result.stderr).toContain("price_");
    } finally {
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  test("accepts valid fixture data and generates a catalog with 12 variants", async () => {
    const dataDir = await mkdtemp(path.join(os.tmpdir(), "cochlearfit-bundler-valid-"));
    const outFile = path.join(dataDir, "worker-catalog.generated.ts");

    try {
      const products: CochlearfitProductRecord[] = [
        { sku: "P1", title: { en: "product.one" } },
        { sku: "P2", title: { en: "product.two" } },
      ];

      const sizes: Array<VariantPricingRecord["size"]> = ["kids", "adult"];
      const colors: Array<VariantPricingRecord["color"]> = ["sand", "ocean", "berry"];

      const variants: VariantPricingRecord[] = [];
      for (const productSlug of ["P1", "P2"] as const) {
        for (const size of sizes) {
          for (const color of colors) {
            const id = `${productSlug}_${size}_${color}`;
            variants.push({
              id,
              productSlug,
              size,
              color,
              price: 10,
              currency: "USD",
              stripePriceId: `price_test_${id}`,
            });
          }
        }
      }

      const inventory: InventoryRecord[] = variants.map((v) => ({ sku: v.id, quantity: 1 }));

      await Promise.all([
        writeJson(path.join(dataDir, "products.json"), products),
        writeJson(path.join(dataDir, "variants.json"), variants),
        writeJson(path.join(dataDir, "inventory.json"), inventory),
      ]);

      const bundler = runBundler({ dataDir, outFile });
      expect(bundler.status).toBe(0);

      const importer = runImportCatalogLength(outFile);
      expect(importer.status).toBe(0);
      expect(Number(importer.stdout.trim())).toBe(12);
    } finally {
      await rm(dataDir, { recursive: true, force: true });
    }
  });
});
