"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";

import { useTranslations } from "@acme/i18n";

import Button from "@/components/Button";
import Grid from "@/components/layout/Grid";
import Price from "@/components/Price";
import ProductStickyBar from "@/components/ProductStickyBar";
import QuantityStepper from "@/components/QuantityStepper";
import Section from "@/components/Section";
import VariantSelector from "@/components/VariantSelector";
import { useCart } from "@/contexts/cart/CartContext";
import { useVariantSelection } from "@/hooks/useVariantSelection";
import { clampQuantity } from "@/lib/quantity";
import type { Product } from "@/types/product";

export default function ProductDetail({ product }: { product: Product }) {
  const t = useTranslations();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const {
    sizes,
    colors,
    size,
    color,
    selectedVariant,
    onSizeChange,
    onColorChange,
  } = useVariantSelection(product);

  const handleQuantityChange = useCallback((next: number) => {
    setQuantity(clampQuantity(next));
  }, []);

  const handleAdd = useCallback(() => {
    addItem(selectedVariant.id, quantity);
  }, [addItem, quantity, selectedVariant.id]);

  const isOutOfStock = useMemo(() => !selectedVariant.inStock, [selectedVariant.inStock]);
  // i18n-exempt -- CF-1004 image sizes attribute [ttl=2026-12-31]
  const imageSizes = "(max-width: 480px) 100vw, 420px";
  const outOfStockClasses = [
    "rounded-full",
    "bg-muted/20",
    "px-3",
    "py-1",
    "text-xs",
    "font-semibold",
    "text-muted-foreground",
  ];
  const inStockClasses = [
    "rounded-full",
    "bg-success/20",
    "px-3",
    "py-1",
    "text-xs",
    "font-semibold",
    "text-success-foreground",
  ];

  return (
    <div className="space-y-10">
      <Section>
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t(product.style) as string}
            </div>
            <h1 className="font-display text-3xl font-semibold">
              {t(product.name) as string}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(product.longDescription) as string}
            </p>
          </div>
          <Grid className="gap-4">
            {product.images.map((image) => (
              <div key={image.src} className="relative aspect-card overflow-hidden rounded-3xl bg-surface-2">
                <Image
                  src={image.src}
                  alt={t(image.alt) as string}
                  fill
                  sizes={imageSizes}
                  className="object-cover"
                />
              </div>
            ))}
          </Grid>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-semibold">
              <Price amount={selectedVariant.price} currency={selectedVariant.currency} />
            </div>
            <div
              className={(isOutOfStock ? outOfStockClasses : inStockClasses).join(" ")}
            >
              {isOutOfStock ? (t("product.outOfStock") as string) : (t("product.inStock") as string)}
            </div>
          </div>
          <VariantSelector
            sizes={sizes}
            colors={colors}
            size={size}
            color={color}
            onSizeChange={onSizeChange}
            onColorChange={onColorChange}
          />
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("product.quantity") as string}
            </div>
            <QuantityStepper
              quantity={quantity}
              onChange={handleQuantityChange}
              label={t("product.quantity") as string}
            />
          </div>
          <Button type="button" onClick={handleAdd} disabled={isOutOfStock}>
            {t("product.addToCart") as string}
          </Button>
        </div>
      </Section>

      <Section className="pt-0">
        <div className="space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("product.features") as string}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {product.featureBullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 text-primary">
                    +
                  </span>
                  <span>{t(bullet) as string}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("product.materials") as string}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {product.materials.map((material) => (
                <li key={material}>{t(material) as string}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("product.care") as string}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {product.careInstructions.map((instruction) => (
                <li key={instruction}>{t(instruction) as string}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("product.compatibility") as string}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {product.compatibilityNotes.map((note) => (
                <li key={note}>{t(note) as string}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <ProductStickyBar
        amount={selectedVariant.price}
        currency={selectedVariant.currency}
        onAdd={handleAdd}
        disabled={isOutOfStock}
        label={t("product.addToCart") as string}
      />
    </div>
  );
}
