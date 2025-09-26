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
  return (
    <section className={[className, luxury ? "space-y-6" : "space-y-4"].filter(Boolean).join(" ") || undefined} {...rest}>
      <h1 className={["font-semibold", luxury ? "text-3xl tracking-wide" : "text-2xl"].join(" ")}>{product.title}</h1>
      {typeof product.price === "number" ? (
        <Price amount={product.price} className={luxury ? "text-xl" : "text-lg"} />
      ) : null}
      {product.description ? (
        <p className={luxury ? "max-w-2xl leading-8 text-neutral-700" : "max-w-xl text-neutral-700"}>{product.description}</p>
      ) : null}
    </section>
  );
}

