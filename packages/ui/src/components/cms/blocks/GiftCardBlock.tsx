"use client";

import { useState } from "react";
import { Button } from "../../atoms/shadcn";

interface Props {
  /** Available gift card denominations */
  amounts?: number[];
  /** Optional description shown above the options */
  description?: string;
  /** Callback when purchase button is clicked */
  onPurchase?: (amount: number) => void;
}

export default function GiftCardBlock({
  amounts = [],
  description,
  onPurchase,
}: Props) {
  const [selected, setSelected] = useState<number | null>(
    amounts.length ? amounts[0] : null,
  );

  const handlePurchase = () => {
    if (selected != null) {
      onPurchase?.(selected);
    }
  };

  if (!amounts.length) return null;

  return (
    <div className="space-y-4">
      {description && <p>{description}</p>}
      <div className="flex flex-wrap gap-2">
        {amounts.map((amt) => (
          <Button
            key={amt}
            type="button"
            variant={selected === amt ? "default" : "outline"}
            onClick={() => setSelected(amt)}
          >
            ${amt}
          </Button>
        ))}
      </div>
      <Button type="button" onClick={handlePurchase} disabled={selected == null}>
        Purchase
      </Button>
    </div>
  );
}

