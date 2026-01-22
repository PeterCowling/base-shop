/* File: src/components/bar/orderTaking/ProductGrid.tsx */
import React, { type FC, useCallback, useMemo } from "react";

import useGridColumns from "../../../hooks/orchestrations/bar/actions/clientActions/useGridColumns";
import { type Product, type ProductGridProps } from "../../../types/bar/BarTypes";

interface ProductItemProps {
  product: Product;
  onAdd: (name: string, price: number) => void;
}

/**
 * ProductItem:
 * - Square, responsive button with subtle hover / active effects
 * - Price badge bottom‑right (makes price always visible)
 * - Line‑breaks long names automatically
 */
const ProductItem: FC<ProductItemProps> = React.memo(({ product, onAdd }) => {
  const handleClick = useCallback(
    () => onAdd(product.name, product.price),
    [onAdd, product.name, product.price]
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "relative flex aspect-square w-full select-none items-center justify-center overflow-hidden rounded-lg text-center font-semibold shadow-md motion-safe:transition-transform",
        "hover:scale-[1.03] active:scale-[0.97]",
        product.bgColor || "bg-gray-200",
        "dark:bg-darkSurface",
      ].join(" ")}
    >
      <span className="whitespace-pre-line break-words px-1 text-sm leading-5 text-white drop-shadow">
        {product.name.replace(/\s+/g, "\n")}
      </span>

      {/* Price badge */}
      <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
        €{product.price.toFixed(2)}
      </span>
    </button>
  );
});
ProductItem.displayName = "ProductItem";

/**
 * ProductGrid:
 * - Auto‑column layout based on viewport (custom hook)
 * - Smooth scrolling with overscroll containment
 */
const ProductGrid: FC<ProductGridProps> = React.memo(
  ({ products, onAddProduct }) => {
    const columns = useGridColumns();
    const gridTemplate = useMemo<React.CSSProperties>(
      () => ({ gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` }),
      [columns]
    );

    const handleAdd = useCallback(
      (n: string, p: number) => onAddProduct(n, p),
      [onAddProduct]
    );

    return (
      <div
        className="grid max-h-[38rem] gap-2 overflow-y-auto overscroll-contain py-3 dark:bg-darkBg"
        style={gridTemplate}
      >
        {products.map((p) => (
          <ProductItem key={p.name} product={p} onAdd={handleAdd} />
        ))}
      </div>
    );
  }
);
ProductGrid.displayName = "ProductGrid";
export default ProductGrid;
