"use client";

import {
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import type { Shop } from "@acme/types";
import type { ChangeEvent } from "react";

export type LuxuryFeatureToggleKey = Exclude<
  keyof Shop["luxuryFeatures"],
  "fraudReviewThreshold"
>;

interface ShopIdentitySectionProps {
  info: Shop;
  errors: Record<string, string[]>;
  onInfoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLuxuryFeatureToggle: (feature: LuxuryFeatureToggleKey, value: boolean) => void;
  onFraudReviewThresholdChange: (value: number) => void;
}

const luxuryFeatures: { key: LuxuryFeatureToggleKey; label: string }[] = [
  { key: "blog", label: "Enable blog" },
  { key: "contentMerchandising", label: "Content merchandising" },
  { key: "raTicketing", label: "RA ticketing" },
  { key: "requireStrongCustomerAuth", label: "Require strong customer auth" },
  { key: "strictReturnConditions", label: "Strict return conditions" },
  { key: "trackingDashboard", label: "Tracking dashboard" },
];

export default function ShopIdentitySection({
  info,
  errors,
  onInfoChange,
  onLuxuryFeatureToggle,
  onFraudReviewThresholdChange,
}: ShopIdentitySectionProps) {
  const handleFraudThresholdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    onFraudReviewThresholdChange(Number.isNaN(value) ? 0 : value);
  };

  return (
    <Card className="col-span-full">
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Name</span>
            <Input
              className="border p-2"
              name="name"
              value={info.name}
              onChange={onInfoChange}
              aria-invalid={errors.name ? true : undefined}
            />
            {errors.name && (
              <span role="alert" className="text-sm text-red-600">
                {errors.name.join("; ")}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Theme</span>
            <Input
              className="border p-2"
              name="themeId"
              value={info.themeId}
              onChange={onInfoChange}
              aria-invalid={errors.themeId ? true : undefined}
            />
            {errors.themeId && (
              <span role="alert" className="text-sm text-red-600">
                {errors.themeId.join("; ")}
              </span>
            )}
          </label>
        </div>
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Luxury features</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {luxuryFeatures.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  name={key}
                  checked={Boolean(info.luxuryFeatures?.[key])}
                  onCheckedChange={(checked) =>
                    onLuxuryFeatureToggle(key, Boolean(checked))
                  }
                />
                <span>{label}</span>
              </label>
            ))}
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-sm font-medium">Fraud review threshold</span>
              <Input
                type="number"
                name="fraudReviewThreshold"
                value={info.luxuryFeatures?.fraudReviewThreshold ?? 0}
                onChange={handleFraudThresholdChange}
              />
            </label>
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
