"use client";

import * as React from "react";

import type { SKU } from "@acme/types";

import { StickyAddToCartBar } from "../../organisms/StickyAddToCartBar";

export default function StickyBuyBar({ product, className, ...rest }: { product: SKU; className?: string }) {
  return <StickyAddToCartBar product={product} className={className} {...rest} />;
}

