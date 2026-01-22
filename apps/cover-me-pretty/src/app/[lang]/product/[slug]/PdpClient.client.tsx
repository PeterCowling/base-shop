// apps/cover-me-pretty/src/app/[lang]/product/[slug]/PdpClient.tsx
"use client";

import ImageGallery from "@acme/platform-core/components/pdp/ImageGallery";
import SizeSelector from "@acme/platform-core/components/pdp/SizeSelector";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { Price } from "@acme/design-system/atoms/Price";
import type { SKU } from "@acme/types";
import { useState } from "react";
import Section from "@acme/cms-ui/blocks/Section";
import { useTranslations } from "@acme/i18n/Translations";
import TryOnPanel from "./TryOnPanel.client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logAnalyticsEvent } from "@acme/platform-core/analytics/client";

export default function PdpClient({ product }: { product: SKU }) {
  const t = useTranslations();
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void logAnalyticsEvent({ type: "product_view", productId: product.slug, path: pathname });
  }, [pathname, product.slug]);


  return (
    <Section contentWidth="wide">
      <div className="p-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div onClick={() => logAnalyticsEvent({ type: "media_interaction", productId: product.slug, action: "open_gallery" })}>
          <ImageGallery items={product.media} />
        </div>

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
            onAdded={() =>
              logAnalyticsEvent({
                type: "add_to_cart",
                productId: product.slug,
                size: size ?? undefined,
                quantity,
                source: "pdp",
              })
            }
          />

          <TryOnPanel product={product} />
        </section>
      </div>
    </Section>
  );
}
