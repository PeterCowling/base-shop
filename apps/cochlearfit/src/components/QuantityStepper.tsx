"use client";

import React, { useCallback, useMemo } from "react";

import Inline from "@/components/layout/Inline";
import { MAX_QTY, MIN_QTY } from "@/lib/quantity";

type QuantityStepperProps = {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label: string;
};

const QuantityStepper = React.memo(function QuantityStepper({
  quantity,
  onChange,
  min = MIN_QTY,
  max = MAX_QTY,
  label,
}: QuantityStepperProps) {
  const canDecrease = useMemo(() => quantity > min, [quantity, min]);
  const canIncrease = useMemo(() => quantity < max, [quantity, max]);
  const decreaseLabel = useMemo(() => `${label} -`, [label]);
  const increaseLabel = useMemo(() => `${label} +`, [label]);

  const handleDecrease = useCallback(() => {
    if (canDecrease) onChange(quantity - 1);
  }, [canDecrease, onChange, quantity]);

  const handleIncrease = useCallback(() => {
    if (canIncrease) onChange(quantity + 1);
  }, [canIncrease, onChange, quantity]);

  return (
    <Inline className="items-center gap-2" aria-label={label}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={!canDecrease}
        aria-label={decreaseLabel}
        className="size-12 rounded-full border border-border-1 text-lg font-semibold text-foreground transition hover:border-primary/60 disabled:opacity-40"
      >
        -
      </button>
      <div className="min-w-8 text-center text-sm font-semibold">{quantity}</div>
      <button
        type="button"
        onClick={handleIncrease}
        disabled={!canIncrease}
        aria-label={increaseLabel}
        className="size-12 rounded-full border border-border-1 text-lg font-semibold text-foreground transition hover:border-primary/60 disabled:opacity-40"
      >
        +
      </button>
    </Inline>
  );
});

export default QuantityStepper;
