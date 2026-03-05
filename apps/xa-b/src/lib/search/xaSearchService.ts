"use client";

import { XA_PRODUCTS, type XaProduct } from "../demoData";

import { toXaSearchDoc } from "./xaSearchConfig";
import { readXaSearchCache, writeXaSearchCache, type XaSearchIndexJson } from "./xaSearchDb";
import { buildXaSearchIndex, loadXaSearchIndex, searchXaIndex } from "./xaSearchWorkerClient";

type XaSearchService = {
  getAllProducts: () => XaProduct[];
  searchProducts: (query: string, opts?: { limit?: number }) => Promise<XaProduct[]>;
};

let servicePromise: Promise<XaSearchService> | null = null;

function toProductMap(products: XaProduct[]) {
  const map = new Map<string, XaProduct>();
  for (const product of products) map.set(product.slug, product);
  return map;
}

async function initXaSearchService(): Promise<XaSearchService> {
  const cached = await readXaSearchCache();
  const version = cached.version;
  let products = cached.products ?? [];
  let indexJson: XaSearchIndexJson | undefined = cached.index;
  let byId = toProductMap(products);

  if (!products.length && XA_PRODUCTS.length) {
    products = XA_PRODUCTS;
    byId = toProductMap(products);
  }

  const ensureWorkerReady = async () => {
    if (indexJson) {
      await loadXaSearchIndex(indexJson);
      return;
    }
    if (!products.length) return;
    indexJson = await buildXaSearchIndex(products.map(toXaSearchDoc));
    await writeXaSearchCache({ index: indexJson, version, products, syncedAt: Date.now() });
  };

  await ensureWorkerReady();

  return {
    getAllProducts: () => products,
    async searchProducts(query, opts) {
      const trimmed = query.trim();
      if (!trimmed) return products;
      const limit = opts?.limit ?? 250;
      try {
        const ids = await searchXaIndex(trimmed, limit);
        if (!ids.length) return [];
        const out: XaProduct[] = [];
        for (const id of ids) {
          const product = byId.get(id);
          if (product) out.push(product);
        }
        return out;
      } catch {
        const q = trimmed.toLowerCase();
        return products.filter((p) => {
          const haystack = `${p.title} ${p.brand} ${p.collection}`.toLowerCase();
          return haystack.includes(q);
        });
      }
    },
  };
}

export function getXaSearchService() {
  servicePromise ??= initXaSearchService();
  return servicePromise;
}
