"use client";

import {
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@/components/molecules/FormField";
import type { Shop } from "@acme/types";
import { type ChangeEvent, useMemo } from "react";

const LUXURY_FEATURE_TOGGLES = [
  {
    key: "blog",
    label: "Enable blog",
    description: "Publish editorial stories powered by the CMS blog pipeline.",
  },
  {
    key: "contentMerchandising",
    label: "Content merchandising",
    description: "Unlock landing pages and style guides that spotlight collections.",
  },
  {
    key: "raTicketing",
    label: "RA ticketing",
    description: "Route boutique styling requests into the concierge ticket queue.",
  },
  {
    key: "requireStrongCustomerAuth",
    label: "Require strong customer auth",
    description: "Capture step-up authentication when high-risk orders are detected.",
  },
  {
    key: "strictReturnConditions",
    label: "Strict return conditions",
    description: "Enforce detailed QC steps before inbound returns are accepted.",
  },
  {
    key: "trackingDashboard",
    label: "Tracking dashboard",
    description: "Surface live parcel updates for stylists inside the operations hub.",
  },
  {
    key: "premierDelivery",
    label: "Premier delivery",
    description: "Expose white-glove delivery windows for top-tier members.",
  },
] as const satisfies ReadonlyArray<{
  key: Exclude<keyof Shop["luxuryFeatures"], "fraudReviewThreshold">;
  label: string;
  description: string;
}>;

type LuxuryFeatureKey = (typeof LUXURY_FEATURE_TOGGLES)[number]["key"];

type ShopIdentityErrors = Partial<
  Record<
    | "name"
    | "themeId"
    | "luxuryFeatures"
    | "fraudReviewThreshold"
    | LuxuryFeatureKey
    | `luxuryFeatures.${LuxuryFeatureKey}`
    | "luxuryFeatures.fraudReviewThreshold",
    string[]
  >
>;

export interface ShopIdentitySectionProps {
  info: Shop;
  errors?: ShopIdentityErrors | Record<string, string[]>;
  onInfoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLuxuryFeatureChange: <K extends keyof Shop["luxuryFeatures"]>(
    feature: K,
    value: Shop["luxuryFeatures"][K],
  ) => void;
}

function collectErrors(
  errors: ShopIdentitySectionProps["errors"],
  keys: readonly string[],
) {
  if (!errors) return undefined;
  const messages = keys.flatMap((key) => errors[key] ?? []);
  return messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopIdentitySection({
  info,
  errors,
  onInfoChange,
  onLuxuryFeatureChange,
}: ShopIdentitySectionProps) {
  const luxuryError = useMemo(
    () =>
      collectErrors(errors, [
        "luxuryFeatures",
        ...LUXURY_FEATURE_TOGGLES.map((feature) => feature.key),
        ...LUXURY_FEATURE_TOGGLES.map(
          (feature) => `luxuryFeatures.${feature.key}`,
        ),
      ]),
    [errors],
  );

  const nameError = collectErrors(errors, ["name"]);
  const themeError = collectErrors(errors, ["themeId"]);
  const fraudError = collectErrors(errors, [
    "fraudReviewThreshold",
    "luxuryFeatures.fraudReviewThreshold",
  ]);

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Identity</h3>
          <p className="text-sm text-muted-foreground">
            Configure how the storefront introduces itself across every customer touchpoint.
          </p>
        </div>

        <FormField
          label="Name"
          htmlFor="shop-name"
          error={nameError && <span role="alert">{nameError}</span>}
        >
          <Input
            id="shop-name"
            name="name"
            value={info.name}
            onChange={onInfoChange}
            placeholder="Maison de Luxe"
            aria-invalid={nameError ? true : undefined}
          />
        </FormField>

        <FormField
          label="Theme"
          htmlFor="shop-theme-id"
          error={themeError && <span role="alert">{themeError}</span>}
        >
          <Input
            id="shop-theme-id"
            name="themeId"
            value={info.themeId}
            onChange={onInfoChange}
            placeholder="bcd-classic"
            aria-invalid={themeError ? true : undefined}
          />
        </FormField>

        <FormField
          label="Luxury features"
          error={luxuryError && <span role="alert">{luxuryError}</span>}
        >
          <div className="space-y-3">
            {LUXURY_FEATURE_TOGGLES.map((feature) => {
              const checkboxId = `luxury-feature-${feature.key}`;
              const checked = Boolean(info.luxuryFeatures[feature.key]);
              return (
                <label
                  key={feature.key}
                  htmlFor={checkboxId}
                  className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                >
                  <Checkbox
                    id={checkboxId}
                    name={feature.key}
                    value="on"
                    checked={checked}
                    onCheckedChange={(state) =>
                      onLuxuryFeatureChange(feature.key, state === true)
                    }
                    aria-describedby={`${checkboxId}-description`}
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-medium text-foreground">
                      {feature.label}
                    </span>
                    <span
                      id={`${checkboxId}-description`}
                      className="mt-1 block text-muted-foreground"
                    >
                      {feature.description}
                    </span>
                  </span>
                </label>
              );
            })}
            <FormField
              label="Fraud review threshold"
              htmlFor="luxury-fraud-threshold"
              error={fraudError && <span role="alert">{fraudError}</span>}
              className="max-w-xs"
            >
              <Input
                id="luxury-fraud-threshold"
                type="number"
                inputMode="numeric"
                name="fraudReviewThreshold"
                value={info.luxuryFeatures.fraudReviewThreshold}
                min={0}
                onChange={(event) =>
                  onLuxuryFeatureChange(
                    "fraudReviewThreshold",
                    Number(event.target.value),
                  )
                }
                aria-invalid={fraudError ? true : undefined}
              />
            </FormField>
          </div>
        </FormField>
      </CardContent>
    </Card>
  );
}
