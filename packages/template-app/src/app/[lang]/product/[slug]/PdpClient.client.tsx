// packages/template-app/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";

import { useState } from "react";

import { Price } from "@acme/design-system/atoms/Price";
import { useTranslations } from "@acme/i18n";
import ImageGallery from "@acme/platform-core/components/pdp/ImageGallery";
import SizeSelector from "@acme/platform-core/components/pdp/SizeSelector";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import type { SKU } from "@acme/types";

export default function PdpClient({ product }: { product: SKU }) {
  const t = useTranslations();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="container mx-auto p-6 lg:grid lg:grid-cols-2 lg:gap-10">
      <ImageGallery items={product.media} />

      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p className="text-muted-foreground">{product.description}</p>

        <div>
          <div className="mb-2 font-medium">{t("pdp.selectSize")}</div>
          <SizeSelector sizes={product.sizes} onSelect={setSize} />
        </div>

        <div className="text-2xl font-semibold">
          <Price amount={product.price} />
        </div>
        <div>
          <label className="mb-2 block font-medium" htmlFor="qty">
            {t("pdp.quantity")}
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 rounded border p-2"
          />
        </div>

        {/* size could be added to cart line later */}
        <AddToCartButton
          sku={product}
          size={size ?? undefined}
          disabled={!size}
          quantity={quantity}
        />
      </section>
    </div>
  );
}
