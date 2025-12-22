"use client";

import React from "react";
import Button from "@/components/Button";
import Price from "@/components/Price";
import type { CurrencyCode } from "@/types/product";
import Container from "@/components/layout/Container";

type ProductStickyBarProps = {
  amount: number;
  currency: CurrencyCode;
  onAdd: () => void;
  disabled: boolean;
  label: string;
};

const ProductStickyBar = React.memo(function ProductStickyBar({
  amount,
  currency,
  onAdd,
  disabled,
  label,
}: ProductStickyBarProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-border-1 bg-surface-1/95 py-4 backdrop-blur">
      <Container className="flex items-center justify-between gap-4">
        <div className="text-lg font-semibold">
          <Price amount={amount} currency={currency} />
        </div>
        <Button type="button" onClick={onAdd} disabled={disabled} className="flex-1">
          {label}
        </Button>
      </Container>
    </div>
  );
});

export default ProductStickyBar;
