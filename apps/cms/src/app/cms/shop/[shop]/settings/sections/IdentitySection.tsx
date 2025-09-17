"use client";

import { Card, CardContent, Checkbox, FormField, Input } from "@ui";
import type { Shop } from "@acme/types";
import { renderError } from "./shared";

export type IdentityLuxuryFeatures = Pick<
  Shop["luxuryFeatures"],
  | "blog"
  | "contentMerchandising"
  | "raTicketing"
  | "fraudReviewThreshold"
  | "requireStrongCustomerAuth"
  | "strictReturnConditions"
  | "trackingDashboard"
>;

export interface IdentitySectionValues {
  name: string;
  themeId: string;
  luxuryFeatures: IdentityLuxuryFeatures;
}

export interface IdentitySectionProps {
  values: IdentitySectionValues;
  errors: Partial<Record<"name" | "themeId", string[]>>;
  onNameChange: (value: string) => void;
  onThemeIdChange: (value: string) => void;
  onLuxuryFeatureChange: <K extends keyof IdentityLuxuryFeatures>(
    feature: K,
    value: IdentityLuxuryFeatures[K],
  ) => void;
}

type BooleanLuxuryFeature = Exclude<
  keyof IdentityLuxuryFeatures,
  "fraudReviewThreshold"
>;

const booleanFeatures: Array<{
  key: BooleanLuxuryFeature;
  label: string;
}> = [
  { key: "blog", label: "Enable blog" },
  { key: "contentMerchandising", label: "Content merchandising" },
  { key: "raTicketing", label: "RA ticketing" },
  {
    key: "requireStrongCustomerAuth",
    label: "Require strong customer auth",
  },
  { key: "strictReturnConditions", label: "Strict return conditions" },
  { key: "trackingDashboard", label: "Tracking dashboard" },
];

export function IdentitySection({
  values,
  errors,
  onNameChange,
  onThemeIdChange,
  onLuxuryFeatureChange,
}: IdentitySectionProps) {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Name"
            htmlFor="shop-name"
            error={renderError(errors.name)}
            className="md:col-span-1"
          >
            <Input
              id="shop-name"
              name="name"
              value={values.name}
              onChange={(event) => onNameChange(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
            />
          </FormField>
          <FormField
            label="Theme"
            htmlFor="shop-theme"
            error={renderError(errors.themeId)}
            className="md:col-span-1"
          >
            <Input
              id="shop-theme"
              name="themeId"
              value={values.themeId}
              onChange={(event) => onThemeIdChange(event.target.value)}
              aria-invalid={errors.themeId ? true : undefined}
            />
          </FormField>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Luxury features</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {booleanFeatures.map(({ key, label }) => {
              const checked = Boolean(values.luxuryFeatures[key]);
              const checkboxId = `luxury-${key}`;
              const labelId = `${checkboxId}-label`;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-md border p-3"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={checkboxId}
                      aria-labelledby={labelId}
                      checked={checked}
                      onCheckedChange={(next) =>
                        onLuxuryFeatureChange(
                          key,
                          Boolean(next) as IdentityLuxuryFeatures[typeof key],
                        )
                      }
                    />
                    <span id={labelId} className="text-sm">
                      {label}
                    </span>
                  </div>
                  {checked && (
                    <input
                      type="hidden"
                      name={key}
                      value="on"
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>
          <FormField
            label="Fraud review threshold"
            htmlFor="fraud-review-threshold"
          >
            <Input
              id="fraud-review-threshold"
              type="number"
              name="fraudReviewThreshold"
              value={
                values.luxuryFeatures.fraudReviewThreshold?.toString() ?? ""
              }
              onChange={(event) =>
                onLuxuryFeatureChange(
                  "fraudReviewThreshold",
                  Number(event.target.value),
                )
              }
              min={0}
              step={1}
              inputMode="numeric"
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}

export default IdentitySection;
