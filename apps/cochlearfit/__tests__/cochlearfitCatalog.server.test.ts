/* eslint-disable security/detect-non-literal-fs-filename -- Test uses temp directories for DATA_ROOT fixture paths. */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { products as fallbackProducts } from "@/data/products";
import {
  listCochlearfitProducts,
  listCochlearfitProductSlugs,
} from "@/lib/cochlearfitCatalog.server";

describe("cochlearfitCatalog.server", () => {
  const originalDataRoot = process.env["DATA_ROOT"];

  afterEach(() => {
    if (typeof originalDataRoot === "string") {
      process.env["DATA_ROOT"] = originalDataRoot;
    } else {
      delete process.env["DATA_ROOT"];
    }
  });

  it("falls back to in-repo catalog when data/shops catalog files are missing", async () => {
    delete process.env["DATA_ROOT"];

    const products = await listCochlearfitProducts("en");
    expect(products).toEqual(fallbackProducts);

    const slugs = await listCochlearfitProductSlugs();
    expect(slugs).toEqual(fallbackProducts.map((product) => product.slug));
  });

  it("uses DATA_ROOT catalog when products.json exists", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cochlearfit-catalog-"));
    const dataRoot = path.join(dir, "data", "shops");

    const shopDir = path.join(dataRoot, "cochlearfit");
    mkdirSync(shopDir, { recursive: true });

    const productsPath = path.join(shopDir, "products.json");

    // Minimal catalog to prove we select the data-backed path.
    writeFileSync(
      productsPath,
      JSON.stringify(
        [
          {
            sku: "sample",
            status: "active",
            title: { en: "Sample" },
            description: { en: "Sample description" },
            media: [],
          },
        ],
        null,
        2,
      ),
      "utf8",
    );

    process.env["DATA_ROOT"] = dataRoot;

    const products = await listCochlearfitProducts("en");
    expect(products).toHaveLength(1);
    expect(products[0]?.slug).toBe("sample");

    const slugs = await listCochlearfitProductSlugs();
    expect(slugs).toEqual(["sample"]);

    rmSync(dir, { recursive: true, force: true });
  });
});
