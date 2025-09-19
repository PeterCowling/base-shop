import { Card, CardContent, Input } from "../atoms/shadcn";
import { Chip } from "../atoms";
import { useId, type ChangeEvent } from "react";

interface PricingTabProps {
  price: number;
  currency?: string | null;
  onPriceChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export default function PricingTab({
  price,
  currency,
  onPriceChange,
}: PricingTabProps) {
  const priceInputId = useId();
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Input
              id={priceInputId}
              label="Price (cents)"
              type="number"
              name="price"
              value={price}
              onChange={onPriceChange}
              required
              min={0}
            />
          </div>
          {currency && (
            <Chip className="bg-muted px-3 py-1 text-xs uppercase tracking-wide">
              {currency}
            </Chip>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
