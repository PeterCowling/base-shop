"use client";

import type { ComponentProps } from "react";

import ProductDetail from "@/components/ProductDetail";
import { withErrorBoundary } from "@/hoc/withErrorBoundary";

const ProductDetailBoundary = withErrorBoundary(ProductDetail);

export default function ProductDetailWithBoundary(
  props: ComponentProps<typeof ProductDetail>
) {
  return <ProductDetailBoundary {...props} />;
}
