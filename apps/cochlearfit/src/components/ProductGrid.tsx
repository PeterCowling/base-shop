"use client";

import React from "react";
import type { Product } from "@/types/product";
import ProductCard from "@/components/ProductCard";
import Grid from "@/components/layout/Grid";

type ProductGridProps = {
  products: Product[];
};

const ProductGrid = React.memo(function ProductGrid({ products }: ProductGridProps) {
  return (
    <Grid className="gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </Grid>
  );
});

export default ProductGrid;
