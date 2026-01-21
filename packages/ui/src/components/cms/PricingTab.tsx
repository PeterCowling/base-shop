import { type ChangeEvent,useId } from "react";

import { Chip } from "../atoms";
import { Card, CardContent, Input } from "../atoms/shadcn";

// i18n-exempt — admin-only CMS field label
/* i18n-exempt */
const t = (s: string) => s;

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
          <div className="flex flex-col gap-2 sm:w-64">
            <Input
              id={priceInputId}
              label={t("Price (cents)")}
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
