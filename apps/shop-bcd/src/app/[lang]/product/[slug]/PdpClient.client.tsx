// apps/shop-bcd/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";

import ImageGallery from "@platform-core/components/pdp/ImageGallery";
import SizeSelector from "@platform-core/components/pdp/SizeSelector";
import AddToCartButton from "@platform-core/components/shop/AddToCartButton.client";
import { Price } from "@ui/components/atoms/Price";
import type { SKU } from "@acme/types";
import { useState } from "react";
import Section from "@ui/components/cms/blocks/Section";
import { useTranslations } from "@i18n/Translations";

export default function PdpClient({ product }: { product: SKU }) {
  const t = useTranslations();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <Section contentWidth="wide">
      <div className="p-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <ImageGallery items={product.media} />

        <section className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-gray-700">{product.description}</p>

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
    </Section>
  );
}
