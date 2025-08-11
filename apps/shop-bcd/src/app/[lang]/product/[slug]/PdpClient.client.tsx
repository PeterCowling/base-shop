// apps/shop-bcd/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";

import ImageGallery from "@platform-core/src/components/pdp/ImageGallery";
import SizeSelector from "@platform-core/src/components/pdp/SizeSelector";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { Price } from "@ui/components/atoms/Price";
import type { SKU } from "@types";
import { useState } from "react";

export default function PdpClient({ product }: { product: SKU }) {
  const [size, setSize] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-6xl p-6 lg:grid lg:grid-cols-2 lg:gap-10">
      <ImageGallery src={product.image} alt={product.title} />

      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p className="text-gray-700">{product.description}</p>

        <div>
          <div className="mb-2 font-medium">Select size:</div>
          <SizeSelector sizes={product.sizes} onSelect={setSize} />
        </div>

        <div className="text-2xl font-semibold">
          <Price amount={product.price} />
        </div>

        {/* size could be added to cart line later */}
        <AddToCartButton
          sku={product}
          size={size ?? undefined}
          disabled={!size}
        />
      </section>
    </div>
  );
}
