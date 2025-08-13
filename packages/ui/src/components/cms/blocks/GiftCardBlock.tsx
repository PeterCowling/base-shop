"use client";

import { useState } from "react";
import type { SKU } from "@acme/types";
import AddToCartButton from "@platform-core/src/components/shop/AddToCartButton.client";
import { Price } from "../../atoms/Price";

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
    title: `Gift Card` ,
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
    <div className="flex flex-col gap-4">
      {description && <p>{description}</p>}
      <div className="flex gap-2">
        {denominations.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(value)}
            className={`rounded border px-3 py-2 ${
              amount === value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-900"
            }`}
          >
            <Price amount={value} />
          </button>
        ))}
      </div>
      <AddToCartButton sku={sku} />
    </div>
  );
}

