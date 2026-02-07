import "@acme/zod-utils/initZod";

import { type NextRequest,NextResponse } from "next/server";
import { z } from "zod";

import {
  calculateAllAllocationsForShop,
} from "@acme/platform-core/centralInventory/server";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { validateShopName } from "@acme/platform-core/shops/client";
import type { ProductPublication } from "@acme/types";

import { ensureShopReadAccess } from "@/actions/common/auth";

const querySchema = z
  .object({
    shop: z.string().min(1),
    locale: z.string().default("en"),
  })
  .strict();

type AllocationGroup = {
  productId: string;
  totalStock: number;
  variants: Map<string, { variantKey: string; attributes: Record<string, string> }>;
};

function localizedText(
  value: Record<string, string> | undefined,
  locale: string,
): string {
  if (!value) return "";
  const direct = value[locale];
  if (typeof direct === "string" && direct) return direct;
  const en = value.en;
  if (typeof en === "string" && en) return en;
  const first = Object.values(value).find((v) => typeof v === "string" && v);
  return typeof first === "string" ? first : "";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(searchParams.entries())
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { shop, locale } = parsed.data;

  try {
    const normalizedShop = validateShopName(shop);
    await ensureShopReadAccess(normalizedShop);

    const [products, allocations] = await Promise.all([
      readRepo<ProductPublication>(normalizedShop).catch(() => []),
      calculateAllAllocationsForShop(normalizedShop),
    ]);

    const productById = new Map<string, ProductPublication>();
    const productBySku = new Map<string, ProductPublication>();
    for (const product of products) {
      productById.set(product.id, product);
      if (product.sku) productBySku.set(product.sku, product);
    }

    const groups = new Map<string, AllocationGroup>();
    for (const allocation of allocations) {
      const key = allocation.productId;
      const current =
        groups.get(key) ??
        ({
          productId: key,
          totalStock: 0,
          variants: new Map(),
        } as AllocationGroup);
      current.totalStock += allocation.allocatedQuantity;
      current.variants.set(allocation.variantKey, {
        variantKey: allocation.variantKey,
        attributes: allocation.variantAttributes,
      });
      groups.set(key, current);
    }

    const productsOut = Array.from(groups.values()).map((group) => {
      const product =
        productById.get(group.productId) ??
        productBySku.get(group.productId);
      const title = localizedText(
        product?.title as Record<string, string> | undefined,
        locale
      );
      const description = localizedText(
        product?.description as Record<string, string> | undefined,
        locale
      );
      const image =
        product?.media?.find((m) => m.type === "image")?.url ??
        product?.media?.[0]?.url ??
        null;
      const missingFields: string[] = [];
      if (!product) missingFields.push("product");
      if (!title) missingFields.push("title");
      if (!description) missingFields.push("description");
      if (!image) missingFields.push("image");
      if (!product?.price && product?.price !== 0) missingFields.push("price");
      if (!product?.sku) missingFields.push("sku");
      if (group.variants.size === 0) missingFields.push("variants");
      if (group.totalStock <= 0) missingFields.push("stock");

      const launchReady = missingFields.length === 0;

      return {
        id: product?.id ?? group.productId,
        sku: product?.sku ?? group.productId,
        title,
        description,
        price: product?.price ?? 0,
        currency: product?.currency ?? "EUR",
        image,
        stock: group.totalStock,
        variantCount: group.variants.size,
        launchReady,
        missingFields,
      };
    });

    productsOut.sort((a, b) => a.title.localeCompare(b.title));

    return NextResponse.json({ products: productsOut });
  } catch (err) {
    const message = (err as Error).message || "Failed to load products";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
