"use client";

import { useState } from "react";

import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import type { SKU } from "@acme/types";

import { Price } from "../../atoms/Price";
import { Inline,Stack } from "../../atoms/primitives";

interface Props {
  denominations?: number[];
  description?: string;
}

export default function GiftCardBlock({
  denominations = [25, 50, 100],
  description,
}: Props) {
  const [amount, setAmount] = useState(denominations[0]);

  const sku: SKU = {
    id: `gift-${amount}`,
    slug: `gift-card-${amount}`,
    title: `Gift Card` , // i18n-exempt — internal SKU title, not direct UI copy
    price: amount,
    deposit: 0,
    stock: 9999,
    forSale: true,
    forRental: false,
    media: [],
    sizes: [],
    description: description ?? "",
  } as SKU;

  return (
    <Stack gap={4}>
      {description && <p>{description}</p>}
      <Inline gap={2}>
        {denominations.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(value)}
            className={`rounded border px-3 py-2 min-h-10 min-w-10 ${
              amount === value ? "bg-fg" : "bg-bg"
            }`}
            data-token={amount === value ? "--color-fg" : "--color-bg"}
          >
            <Price
              amount={value}
              className={amount === value ? "text-bg" : "text-fg"}
              data-token={amount === value ? "--color-bg" : "--color-fg"}
            />
          </button>
        ))}
      </Inline>
      <AddToCartButton sku={sku} />
    </Stack>
  );
}
