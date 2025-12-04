"use client";

import * as React from "react";
import type { SKU } from "@acme/types";
import { Price } from "../../atoms/Price";

export interface PDPDetailsSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  product: SKU;
  preset?: "default" | "luxury";
}

export default function PDPDetailsSection({ product, preset = "default", className, ...rest }: PDPDetailsSectionProps) {
  const luxury = preset === "luxury";
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const rootClass = [className, luxury ? "space-y-6" : "space-y-4"].filter(Boolean).join(" ");
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const titleClass = ["font-semibold", luxury ? "text-3xl tracking-wide" : "text-2xl"].join(" ");
  // i18n-exempt -- DS-1234 [ttl=2025-11-30]
  const descClass = luxury
    ? "w-full sm:max-w-2xl leading-8 text-muted-foreground" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */
    : "w-full sm:max-w-xl text-muted-foreground" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */;
  return (
    <section className={rootClass || undefined} {...rest}>
      <h1 className={titleClass}>{product.title}</h1>
      {typeof product.price === "number" ? (
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        <Price amount={product.price} className={luxury ? "text-xl" : "text-lg"} />
      ) : null}
      {product.description ? (
        <p className={descClass}>{product.description}</p>
      ) : null}
    </section>
  );
}
