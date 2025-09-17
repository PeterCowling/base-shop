"use client";

import { Card, CardContent, Checkbox, FormField, Input } from "@ui";
import type { Shop } from "@acme/types";
import { useMemo } from "react";

const FEATURE_TOGGLES = [
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

type IdentityValues = Pick<Shop, "name" | "themeId" | "luxuryFeatures">;

type LuxuryFeatureKey = keyof IdentityValues["luxuryFeatures"];

type IdentityErrorKey =
  | "name"
  | "themeId"
  | "fraudReviewThreshold"
  | "luxuryFeatures"
  | `luxuryFeatures.${LuxuryFeatureKey}`;

export type IdentitySectionErrors = Partial<Record<IdentityErrorKey, string[]>>;

export interface IdentitySectionProps {
  values: IdentityValues;
  errors?: IdentitySectionErrors;
  onFieldChange: (field: "name" | "themeId", value: string) => void;
  onLuxuryFeatureChange: <K extends LuxuryFeatureKey>(
    feature: K,
    value: IdentityValues["luxuryFeatures"][K],
  ) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

function aggregateLuxuryErrors(errors: IdentitySectionErrors | undefined) {
  if (!errors) return undefined;
  const keys: IdentityErrorKey[] = ["luxuryFeatures", ...FEATURE_TOGGLES.map((feature) => `luxuryFeatures.${feature.key}` as const), "luxuryFeatures.fraudReviewThreshold"];
  const messages = keys.flatMap((key) => errors[key] ?? []);
  return messages.length > 0 ? messages.join("; ") : undefined;
}

export default function IdentitySection({
  values,
  errors,
  onFieldChange,
  onLuxuryFeatureChange,
}: IdentitySectionProps) {
  const luxuryError = useMemo(() => aggregateLuxuryErrors(errors), [errors]);

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
          label="Shop name"
          htmlFor="shop-name"
          error={formatError(errors?.name)}
        >
          <Input
            id="shop-name"
            name="name"
            value={values.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="Maison de Luxe"
          />
        </FormField>

        <FormField
          label="Theme preset"
          htmlFor="shop-theme-id"
          error={formatError(errors?.themeId)}
        >
          <Input
            id="shop-theme-id"
            name="themeId"
            value={values.themeId}
            onChange={(event) => onFieldChange("themeId", event.target.value)}
            placeholder="bcd-classic"
          />
        </FormField>

        <FormField label="Luxury features" error={luxuryError}>
          <div className="space-y-3">
            {FEATURE_TOGGLES.map((feature) => {
              const checkboxId = `luxury-feature-${feature.key}`;
              const checked = Boolean(values.luxuryFeatures[feature.key]);
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
                      onLuxuryFeatureChange(
                        feature.key,
                        (state === true) as IdentityValues["luxuryFeatures"][typeof feature.key],
                      )
                    }
                    aria-describedby={`${checkboxId}-description`}
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-medium text-foreground">{feature.label}</span>
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
              error={formatError(errors?.fraudReviewThreshold)}
              className="max-w-xs"
            >
              <Input
                id="luxury-fraud-threshold"
                type="number"
                inputMode="numeric"
                name="fraudReviewThreshold"
                value={values.luxuryFeatures.fraudReviewThreshold}
                min={0}
                onChange={(event) =>
                  onLuxuryFeatureChange(
                    "fraudReviewThreshold",
                    Number(event.target.value) as IdentityValues["luxuryFeatures"]["fraudReviewThreshold"],
                  )
                }
              />
            </FormField>
          </div>
        </FormField>
      </CardContent>
    </Card>
  );
}
