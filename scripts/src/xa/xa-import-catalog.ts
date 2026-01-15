import { writeFile } from "node:fs/promises";

import { ulid } from "ulid";

import {
  getRowNumber,
  loadMediaMap,
  parseBool,
  parseDate,
  parseList,
  parseNumber,
  pick,
  readCsv,
  slugify,
  titleCase,
} from "./xa-utils";

import { parseDetailsFromRow, parseTaxonomyFromRow } from "./xa-catalog-parse";
import type { Catalog, CatalogBrand, CatalogCollection, CatalogProduct } from "./xa-catalog-types";
import { buildMediaFromRow, loadExistingCatalog, maybeBackupFile, requireValue } from "./xa-import-catalog-helpers";

export async function runXaCatalogImport(options: {
  productsPath: string;
  imagesPath?: string;
  outPath: string;
  merge: boolean;
  baseCatalogPath?: string;
  backup: boolean;
  backupDir?: string;
  dryRun: boolean;
  strict: boolean;
}): Promise<{ warnings: string[]; outPath: string; catalog: Catalog }> {
  const rows = await readCsv(String(options.productsPath));
  const mediaMap = options.imagesPath ? await loadMediaMap(String(options.imagesPath)) : null;

  const warnings: string[] = [];

  const base = options.merge ? await loadExistingCatalog(options.baseCatalogPath || options.outPath) : null;

  const brandMap = new Map<string, CatalogBrand>();
  const collectionMap = new Map<string, CatalogCollection>();
  const brands: CatalogBrand[] = (base?.brands ?? []).map((b) => ({ ...b }));
  const collections: CatalogCollection[] = (base?.collections ?? []).map((c) => ({ ...c }));
  const products: CatalogProduct[] = (base?.products ?? []).map((p) => ({
    ...p,
    media: [...(p.media ?? [])],
    sizes: [...(p.sizes ?? [])],
    taxonomy: { ...p.taxonomy },
    details: p.details ? { ...p.details } : undefined,
  }));

  for (const brand of brands) brandMap.set(brand.handle, brand);
  for (const collection of collections) collectionMap.set(collection.handle, collection);

  const productsBySlug = new Map<string, CatalogProduct>();
  const productsById = new Map<string, CatalogProduct>();
  for (const product of products) {
    productsBySlug.set(product.slug, product);
    productsById.set(product.id, product);
  }

  const seenSlugs = new Set<string>(products.map((p) => p.slug));
  const seenIds = new Set<string>(products.map((p) => p.id));
  const touchedSlugs = new Set<string>();

  for (const row of rows) {
    const rowNumber = getRowNumber(row);
    const rowLabel = rowNumber ? `Row ${rowNumber}` : "Row ?";
    try {
      const titleRaw = pick(row, ["title", "name"]);
      const idInput = pick(row, ["id", "product_id"]);
      const slugInput = pick(row, ["slug", "handle"]);

      const existingProduct = options.merge
        ? slugInput
          ? productsBySlug.get(slugify(slugInput))
          : idInput
            ? productsById.get(idInput)
            : undefined
        : undefined;

      if (options.merge && !existingProduct && !idInput && !slugInput) {
        throw new Error('Merge mode requires "id" or "slug" on every row.');
      }

      if (existingProduct && slugInput) {
        const normalizedSlug = slugify(slugInput);
        if (normalizedSlug && normalizedSlug !== existingProduct.slug) {
          throw new Error(
            `Slug mismatch for id "${existingProduct.id}": CSV slug "${normalizedSlug}" does not match existing "${existingProduct.slug}".`,
          );
        }
      }
      if (existingProduct && idInput && idInput !== existingProduct.id) {
        throw new Error(
          `ID mismatch for slug "${existingProduct.slug}": CSV id "${idInput}" does not match existing "${existingProduct.id}".`,
        );
      }

      if (options.strict && !existingProduct) {
        if (!idInput) throw new Error('Missing required field "id".');
        if (!slugInput) throw new Error('Missing required field "slug".');
      }

      const title = titleRaw || existingProduct?.title || "";
      if (!title) throw new Error('Missing required field "title".');

      const slug = slugify(slugInput || existingProduct?.slug || title);
      if (!slug) throw new Error('Missing required field "slug".');
      if (options.merge) {
        if (!existingProduct && productsBySlug.has(slug)) {
          throw new Error(
            `Slug "${slug}" already exists in the base catalog. Provide the matching slug/id to update the existing product.`,
          );
        }
        if (touchedSlugs.has(slug)) throw new Error(`Duplicate update row for slug "${slug}".`);
        touchedSlugs.add(slug);
      } else {
        if (seenSlugs.has(slug)) throw new Error(`Duplicate product slug "${slug}".`);
        seenSlugs.add(slug);
      }

      const id = existingProduct?.id || idInput || ulid();
      if (!existingProduct) {
        if (seenIds.has(id)) throw new Error(`Duplicate product id "${id}".`);
        seenIds.add(id);
      }

      const brandHandleCell = pick(row, ["brand_handle"]);
      const brandCell = pick(row, ["brand"]);
      if (brandHandleCell && brandCell) {
        const fromHandle = slugify(brandHandleCell);
        const fromBrand = slugify(brandCell);
        if (fromHandle && fromBrand && fromHandle !== fromBrand) {
          const message = `brand_handle="${brandHandleCell}" conflicts with brand="${brandCell}" (brand_handle takes precedence).`;
          if (options.strict) throw new Error(message);
          warnings.push(`${rowLabel}: ${message}`);
        }
      }

      const brandHandleRaw =
        brandHandleCell ||
        brandCell ||
        existingProduct?.brand ||
        requireValue(row, ["brand_handle", "brand"], "brand_handle", options.strict);
      const brandName =
        pick(row, ["brand_name", "brand_title"]) ||
        brandCell ||
        brandHandleCell ||
        brandMap.get(slugify(brandHandleRaw))?.name ||
        brandHandleRaw;

      const collectionHandleCell = pick(row, ["collection_handle"]);
      const collectionCell = pick(row, ["collection"]);
      if (collectionHandleCell && collectionCell) {
        const fromHandle = slugify(collectionHandleCell);
        const fromLabel = slugify(collectionCell);
        if (fromHandle && fromLabel && fromHandle !== fromLabel) {
          const message = `collection_handle="${collectionHandleCell}" conflicts with collection="${collectionCell}" (collection_handle takes precedence).`;
          if (options.strict) throw new Error(message);
          warnings.push(`${rowLabel}: ${message}`);
        }
      }

      const collectionHandleRaw =
        collectionHandleCell ||
        collectionCell ||
        existingProduct?.collection ||
        requireValue(row, ["collection_handle", "collection"], "collection_handle", options.strict);
      const collectionTitle =
        pick(row, ["collection_title", "collection_name"]) ||
        collectionCell ||
        collectionHandleCell ||
        collectionMap.get(slugify(collectionHandleRaw))?.title ||
        collectionHandleRaw;
      const collectionDescription = pick(row, ["collection_description", "collection_desc"]);

      const brandHandle = slugify(brandHandleRaw || brandName);
      const collectionHandle = slugify(collectionHandleRaw || collectionTitle);
      if (!brandHandle) throw new Error(`Missing brand handle for "${title}".`);
      if (!collectionHandle) throw new Error(`Missing collection handle for "${title}".`);

      if (!brandMap.has(brandHandle)) {
        const brand = { handle: brandHandle, name: brandName || titleCase(brandHandle) };
        brandMap.set(brandHandle, brand);
        brands.push(brand);
      } else if (brandName) {
        brandMap.get(brandHandle)!.name = brandName;
      }

      if (!collectionMap.has(collectionHandle)) {
        const collection = {
          handle: collectionHandle,
          title: collectionTitle || titleCase(collectionHandle),
          ...(collectionDescription ? { description: collectionDescription } : {}),
        };
        collectionMap.set(collectionHandle, collection);
        collections.push(collection);
      } else if (collectionTitle || collectionDescription) {
        const existing = collectionMap.get(collectionHandle)!;
        if (collectionTitle) existing.title = collectionTitle;
        if (collectionDescription) existing.description = collectionDescription;
      }

      const price = parseNumber(pick(row, ["price"]), "price", existingProduct?.price);
      const compareAtRaw = pick(row, ["compare_at_price", "compareatprice"]);
      const compareAtPrice = compareAtRaw
        ? parseNumber(compareAtRaw, "compare_at_price")
        : existingProduct?.compareAtPrice;

      const depositRaw = pick(row, ["deposit"]);
      const deposit = parseNumber(
        depositRaw,
        "deposit",
        existingProduct?.deposit ?? (options.strict ? undefined : 0),
      );

      const stockRaw = pick(row, ["stock"]);
      const stock = parseNumber(
        stockRaw,
        "stock",
        existingProduct?.stock ?? (options.strict ? undefined : 0),
      );

      const forSaleRaw = pick(row, ["for_sale", "forsale"]);
      if (options.strict && !forSaleRaw && existingProduct?.forSale === undefined) {
        throw new Error(`Missing required field "for_sale" for "${title}".`);
      }
      const forSale = parseBool(forSaleRaw, existingProduct?.forSale ?? true);

      const forRentalRaw = pick(row, ["for_rental", "forrental"]);
      if (options.strict && !forRentalRaw && existingProduct?.forRental === undefined) {
        throw new Error(`Missing required field "for_rental" for "${title}".`);
      }
      const forRental = parseBool(forRentalRaw, existingProduct?.forRental ?? false);

      const sizesRaw = pick(row, ["sizes", "size"]);
      const sizes = sizesRaw ? parseList(sizesRaw) : existingProduct?.sizes ?? [];

      const descriptionRaw = pick(row, ["description", "desc"]);
      const description = descriptionRaw || existingProduct?.description || "";
      if (options.strict && !description) {
        throw new Error(`Missing required field "description" for "${title}".`);
      }

      const createdAtRaw = pick(row, ["created_at", "createdat"]);
      if (options.strict && !createdAtRaw && !existingProduct?.createdAt) {
        throw new Error(`Missing required field "created_at" for "${title}".`);
      }
      const createdAt = createdAtRaw ? parseDate(createdAtRaw) : existingProduct?.createdAt || parseDate("");

      const popularityRaw = pick(row, ["popularity", "rank"]);
      const popularity = parseNumber(
        popularityRaw,
        "popularity",
        existingProduct?.popularity ?? (options.strict ? undefined : 0),
      );

      const taxonomy = parseTaxonomyFromRow(row, {
        existing: existingProduct?.taxonomy,
        strict: options.strict,
      });
      if (taxonomy.category === "clothing" && options.strict && sizes.length === 0) {
        throw new Error(`Missing required field "sizes" for clothing product "${slug}".`);
      }

      const details = parseDetailsFromRow(row, {
        existing: existingProduct?.details,
        strict: options.strict,
      });

      const media =
        (mediaMap?.[slug]?.length
          ? mediaMap[slug]!.map((item) => ({
              ...item,
              altText: item.altText || title,
            }))
          : null) ??
        (pick(row, ["media_paths", "media", "images"])
          ? buildMediaFromRow(row, title)
          : existingProduct?.media ?? []);

      if (options.strict && media.length === 0) {
        throw new Error(`Missing images for "${slug}".`);
      }

      const nextProduct: CatalogProduct = {
        id,
        slug,
        title,
        brand: brandHandle,
        collection: collectionHandle,
        price,
        deposit,
        stock,
        forSale,
        forRental,
        media,
        sizes,
        description,
        createdAt,
        popularity,
        taxonomy,
        ...(details ? { details } : {}),
        ...(compareAtPrice !== undefined ? { compareAtPrice } : {}),
      };

      if (existingProduct) {
        Object.assign(existingProduct, nextProduct);
      } else {
        products.push(nextProduct);
        productsBySlug.set(slug, nextProduct);
        productsById.set(id, nextProduct);
        seenSlugs.add(slug);
        seenIds.add(id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`${rowLabel}: ${message}`);
    }
  }

  if (options.strict && mediaMap) {
    const unknown = Object.keys(mediaMap).filter((slug) => !seenSlugs.has(slug));
    if (unknown.length) {
      throw new Error(`Media map contains unknown product slugs: ${unknown.join(", ")}`);
    }
  }

  const catalog: Catalog = { collections, brands, products };
  if (options.dryRun) {
    return { warnings, outPath: options.outPath, catalog };
  }

  const backupPath = await maybeBackupFile(options.outPath, {
    enabled: options.backup,
    backupDir: options.backupDir,
  });
  if (backupPath) {
    console.log(`Backed up ${options.outPath} to ${backupPath}`);
  }

  await writeFile(options.outPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  return { warnings, outPath: options.outPath, catalog };
}
