import type { useProductDetailData } from "../lib/useProductDetailData";
import { formatLabel, formatLabelList } from "../lib/xaCatalog";
import type { XaProduct } from "../lib/xaCatalogModel";
import type { XaCategory } from "../lib/xaTypes";

import { XaSizeGuideDialog } from "./XaSizeGuideDialog.client";

type SectionsCopy = Pick<
  ReturnType<typeof useProductDetailData>["copy"],
  | "sizeFit"
  | "modelIs"
  | "wearsSize"
  | "sizeGuideFallback"
  | "bagDetails"
  | "dimensions"
  | "strapDrop"
  | "whatFits"
  | "interior"
  | "metal"
  | "stone"
  | "size"
  | "clothingMaterialLabel"
  | "jewelryDetailsLabel"
  | "jewelrySizePrefix"
  | "jewelryCareLabel"
>;

export function XaProductDetailSections({
  product,
  category,
  copy,
}: {
  product: XaProduct;
  category: XaCategory;
  copy: SectionsCopy;
}) {
  const isClothing = category === "clothing";
  const isBags = category === "bags";
  const isJewelry = category === "jewelry";

  if (!isClothing && !isBags && !isJewelry) return null;

  return (
    <>
      {isClothing ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold">{copy.sizeFit}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {product.details?.modelHeight ? <div>{copy.modelIs}</div> : null}
              {product.details?.modelSize ? <div>{copy.wearsSize}</div> : null}
              {product.details?.fitNote ? <div>{product.details.fitNote}</div> : null}
            </div>
            <div className="pt-2">
              <XaSizeGuideDialog copy={product.details?.sizeGuide ?? copy.sizeGuideFallback} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">{copy.clothingMaterialLabel}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {product.details?.fabricFeel ? <div>{product.details.fabricFeel}</div> : null}
              {product.details?.care ? <div>{product.details.care}</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {isBags ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold">{copy.bagDetails}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {product.details?.dimensions ? <div>{copy.dimensions}</div> : null}
              {product.details?.strapDrop ? <div>{copy.strapDrop}</div> : null}
            </div>
          </div>

          {product.details?.whatFits?.length ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">{copy.whatFits}</div>
              <div className="text-sm text-muted-foreground">
                {formatLabelList(product.details.whatFits)}
              </div>
            </div>
          ) : null}

          {product.details?.interior?.length ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">{copy.interior}</div>
              <div className="text-sm text-muted-foreground">
                {formatLabelList(product.details.interior)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {isJewelry ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-semibold">{copy.jewelryDetailsLabel}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {product.taxonomy.metal ? (
                <div>{copy.metal}: {formatLabel(product.taxonomy.metal)}</div>
              ) : null}
              {product.taxonomy.gemstone && product.taxonomy.gemstone !== "none" ? (
                <div>{copy.stone}: {formatLabel(product.taxonomy.gemstone)}</div>
              ) : null}
              {product.taxonomy.jewelrySize ? (
                <div>{copy.size}: {formatLabel(product.taxonomy.jewelrySize)}</div>
              ) : null}
              {product.details?.sizeGuide ? (
                <div>{copy.jewelrySizePrefix}{product.details.sizeGuide}</div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">{copy.jewelryCareLabel}</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              {product.details?.care ? <div>{product.details.care}</div> : null}
              {product.details?.warranty ? <div>{product.details.warranty}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
