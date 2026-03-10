import { type CatalogProductDraftInput,deriveCatalogPublishState } from "@acme/lib/xa";

import {
  type CloudDraftSnapshot,
  upsertProductInCloudSnapshot,
} from "./catalogDraftContractClient";

export function updateProductPublishStateInCloudSnapshot(params: {
  snapshot: CloudDraftSnapshot;
  productId: string;
  publishState: "live" | "out_of_stock";
  ifMatch: string;
}):
  | {
      product: CatalogProductDraftInput;
      revision: string;
      products: CatalogProductDraftInput[];
      revisionsById: Record<string, string>;
    }
  | null {
  const productId = params.productId.trim();
  if (!productId) return null;

  const existingProduct =
    params.snapshot.products.find((product) => (product.id ?? "").trim() === productId) ?? null;
  if (!existingProduct) return null;

  return upsertProductInCloudSnapshot({
    product: {
      ...existingProduct,
      publishState: params.publishState,
    },
    ifMatch: params.ifMatch,
    snapshot: params.snapshot,
  });
}

export function promoteDerivedPublishStatesInCloudSnapshot(params: {
  snapshot: CloudDraftSnapshot;
}): {
  products: CatalogProductDraftInput[];
  revisionsById: Record<string, string>;
  promotedProductIds: string[];
} {
  let workingSnapshot = params.snapshot;
  const promotedProductIds: string[] = [];

  for (const product of params.snapshot.products) {
    const nextPublishState = deriveCatalogPublishState(product);
    if (product.publishState === nextPublishState) continue;

    const updated = upsertProductInCloudSnapshot({
      product: {
        ...product,
        publishState: nextPublishState,
      },
      snapshot: workingSnapshot,
    });

    workingSnapshot = {
      ...workingSnapshot,
      products: updated.products,
      revisionsById: updated.revisionsById,
    };

    const productId = (updated.product.id ?? "").trim();
    if (productId) {
      promotedProductIds.push(productId);
    }
  }

  return {
    products: workingSnapshot.products,
    revisionsById: workingSnapshot.revisionsById,
    promotedProductIds,
  };
}
