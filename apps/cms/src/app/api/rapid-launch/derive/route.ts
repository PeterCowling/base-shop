import "@acme/zod-utils/initZod";

import crypto from "node:crypto";

import { type NextRequest,NextResponse } from "next/server";
import { z } from "zod";

import { calculateAllAllocationsForShop } from "@acme/platform-core/centralInventory/server";
import { deriveContent, type LaunchProductInput } from "@acme/platform-core/launch";
import { readRepo } from "@acme/platform-core/repositories/products.server";
import { readShop } from "@acme/platform-core/repositories/shops.server";
import { validateShopName } from "@acme/platform-core/shops/client";
import type { ProductPublication } from "@acme/types";

import { ensureShopReadAccess } from "@/actions/common/auth";

const requestSchema = z
  .object({
    shopId: z.string().min(1),
    storeName: z.string().optional(),
    locale: z.string().min(1),
    currency: z.string().min(1),
    themeId: z.string().min(1),
    brandKit: z.object({
      logoUrl: z.string().min(1),
      faviconUrl: z.string().min(1),
      socialImageUrl: z.string().min(1),
    }),
    productIds: z.array(z.string()).default([]),
    paymentTemplateId: z.string().min(1),
    shippingTemplateId: z.string().min(1),
    taxTemplateId: z.string().min(1),
    legalBundleId: z.string().min(1),
    consentTemplateId: z.string().min(1),
    seo: z.object({
      title: z.string().default(""),
      description: z.string().default(""),
    }),
    cachedHash: z.string().optional(),
    contactEmail: z.string().optional(),
    supportEmail: z.string().optional(),
    returnsAddress: z.string().optional(),
  })
  .strict();

type AllocationEntry = {
  productId: string;
  sku: string;
  variantKey: string;
  variantAttributes: Record<string, string>;
  allocatedQuantity: number;
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

function buildVariantName(attrs: Record<string, string> | undefined): string {
  if (!attrs || Object.keys(attrs).length === 0) return "Default";
  return Object.entries(attrs)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ");
}

function collectSizes(allocations: AllocationEntry[]): string[] | undefined {
  const sizes = new Set<string>();
  for (const allocation of allocations) {
    const entries = allocation.variantAttributes ?? {};
    for (const [key, value] of Object.entries(entries)) {
      if (key.toLowerCase() === "size" && value) sizes.add(value);
    }
  }
  return sizes.size ? Array.from(sizes).sort() : undefined;
}

function buildImages(product?: ProductPublication): string[] {
  const media = product?.media ?? [];
  const images = media.filter((m) => m.type === "image").map((m) => m.url);
  if (images.length > 0) return images;
  return media.map((m) => m.url).filter(Boolean);
}

function createHash(input: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const {
      shopId,
      storeName,
      locale,
      currency,
      themeId,
      brandKit,
      productIds,
      paymentTemplateId,
      shippingTemplateId,
      taxTemplateId,
      legalBundleId,
      consentTemplateId,
      seo,
      cachedHash,
      contactEmail,
      supportEmail,
      returnsAddress,
    } = parsed.data;

    const normalizedShop = validateShopName(shopId);
    await ensureShopReadAccess(normalizedShop);

    const [shopInfo, products, allocations] = await Promise.all([
      readShop(normalizedShop),
      readRepo<ProductPublication>(normalizedShop).catch(() => []),
      calculateAllAllocationsForShop(normalizedShop),
    ]);

    const productById = new Map<string, ProductPublication>();
    const productBySku = new Map<string, ProductPublication>();
    for (const product of products) {
      productById.set(product.id, product);
      if (product.sku) productBySku.set(product.sku, product);
    }

    const allocationsByProduct = new Map<string, AllocationEntry[]>();
    for (const allocation of allocations) {
      const key = allocation.productId;
      if (!key) continue;
      const list = allocationsByProduct.get(key) ?? [];
      list.push(allocation as AllocationEntry);
      allocationsByProduct.set(key, list);
    }

    let resolvedSupportEmail =
      supportEmail?.trim() ||
      (typeof shopInfo.contactInfo === "string" ? shopInfo.contactInfo.trim() : "");
    const resolvedContactEmail =
      contactEmail?.trim() || resolvedSupportEmail;
    if (!resolvedSupportEmail && resolvedContactEmail) {
      resolvedSupportEmail = resolvedContactEmail;
    }

    if (!resolvedSupportEmail && !resolvedContactEmail) {
      return NextResponse.json(
        { error: "Support email is required to generate review content." },
        { status: 400 },
      );
    }

    const launchProducts: LaunchProductInput[] = productIds.map((id) => {
      const product = productById.get(id) ?? productBySku.get(id);
      const productId = product?.id ?? id;
      const productAllocations = allocationsByProduct.get(productId) ?? [];
      const sortedAllocations = [...productAllocations].sort((a, b) => {
        const aKey = a.variantKey || a.sku;
        const bKey = b.variantKey || b.sku;
        return aKey.localeCompare(bKey);
      });
      const variants = sortedAllocations.map((allocation, index) => ({
        id: allocation.variantKey || allocation.sku || `${productId}-variant-${index + 1}`,
        name: buildVariantName(allocation.variantAttributes),
        sku: allocation.sku,
        price: product?.price ?? 0,
        stock: allocation.allocatedQuantity,
        attributes: allocation.variantAttributes,
      }));

      return {
        id: productId,
        name: localizedText(
          product?.title as Record<string, string> | undefined,
          locale,
        ) || product?.sku || productId,
        description: localizedText(
          product?.description as Record<string, string> | undefined,
          locale,
        ),
        images: buildImages(product),
        price: product?.price ?? 0,
        currency: product?.currency ?? currency,
        variants,
        sizes: collectSizes(sortedAllocations),
      };
    });

    const input = {
      shop: {
        name: storeName?.trim() || shopInfo.name || normalizedShop,
        slug: normalizedShop,
        locale,
        currency,
        description: undefined,
        contactEmail: resolvedContactEmail,
        supportEmail: resolvedSupportEmail,
        returnsAddress: returnsAddress?.trim() || undefined,
      },
      theme: { id: themeId },
      brandKit: {
        logoUrl: brandKit.logoUrl,
        faviconUrl: brandKit.faviconUrl,
        socialImageUrl: brandKit.socialImageUrl,
      },
      products: launchProducts,
      commerce: {
        paymentTemplateId,
        shippingTemplateId,
        vatTemplateId: taxTemplateId,
      },
      compliance: {
        legalBundleId,
        consentTemplateId,
      },
      seo: {
        title: seo.title,
        description: seo.description,
      },
    };

    const inputHash = createHash(input);
    if (cachedHash && cachedHash === inputHash) {
      return NextResponse.json({ status: "not-modified", inputHash });
    }

    const output = deriveContent(input);

    return NextResponse.json({
      status: "derived",
      inputHash,
      derivedAt: new Date().toISOString(),
      ...output,
    });
  } catch (err) {
    const message = (err as Error).message || "Failed to derive content";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
