"use client";

import { useMemo } from "react";
import type { Shop } from "@acme/types";
import {
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import type { IdentityField, LuxuryFeatureKey } from "../useShopEditorSubmit";

const FEATURE_TOGGLES = [
  {
    key: "blog",
    label: "Enable blog",
    description:
      "Publish editorial stories powered by the CMS blog pipeline.",
  },
  {
    key: "contentMerchandising",
    label: "Content merchandising",
    description:
      "Unlock landing pages and style guides that spotlight collections.",
  },
  {
    key: "raTicketing",
    label: "RA ticketing",
    description:
      "Route boutique styling requests into the concierge ticket queue.",
  },
  {
    key: "requireStrongCustomerAuth",
    label: "Require strong customer auth",
    description:
      "Capture step-up authentication when high-risk orders are detected.",
  },
  {
    key: "strictReturnConditions",
    label: "Strict return conditions",
    description:
      "Enforce detailed QC steps before inbound returns are accepted.",
  },
  {
    key: "trackingDashboard",
    label: "Tracking dashboard",
    description:
      "Surface live parcel updates for stylists inside the operations hub.",
  },
  {
    key: "premierDelivery",
    label: "Premier delivery",
    description:
      "Expose white-glove delivery windows for top-tier members.",
  },
] as const satisfies ReadonlyArray<{
  key: Exclude<keyof Shop["luxuryFeatures"], "fraudReviewThreshold">;
  label: string;
  description: string;
}>;

type ShopIdentityErrorKey =
  | "name"
  | "themeId"
  | "fraudReviewThreshold"
  | "luxuryFeatures"
  | `luxuryFeatures.${LuxuryFeatureKey}`;

export type ShopIdentitySectionErrors = Partial<
  Record<ShopIdentityErrorKey, string[]>
>;

export interface ShopIdentitySectionProps {
  readonly info: Shop;
  readonly errors?: ShopIdentitySectionErrors;
  readonly onInfoChange: (field: IdentityField, value: string) => void;
  readonly onLuxuryFeatureChange: <K extends LuxuryFeatureKey>(
    feature: K,
    value: Shop["luxuryFeatures"][K],
  ) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

function aggregateLuxuryErrors(errors: ShopIdentitySectionErrors | undefined) {
  if (!errors) return undefined;
  const keys: Array<keyof ShopIdentitySectionErrors> = [
    "luxuryFeatures",
    ...FEATURE_TOGGLES.map(
      (feature) =>
        `luxuryFeatures.${feature.key}` as keyof ShopIdentitySectionErrors,
    ),
    "luxuryFeatures.fraudReviewThreshold",
  ];
  const messages = keys.flatMap((key) => errors[key] ?? []);
  return messages.length > 0 ? messages.join("; ") : undefined;
}

function buildErrorNode(id: string, message?: string) {
  if (!message) return undefined;
  return (
    <span id={id} role="alert">
      {message}
    </span>
  );
}

export default function ShopIdentitySection({
  info,
  errors,
  onInfoChange,
  onLuxuryFeatureChange,
}: ShopIdentitySectionProps) {
  const luxuryError = useMemo(
    () => aggregateLuxuryErrors(errors),
    [errors],
  );

  const nameError = formatError(errors?.name);
  const themeError = formatError(errors?.themeId);
  const fraudError = formatError(errors?.fraudReviewThreshold);

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Identity</h3>
          <p className="text-sm text-muted-foreground">
            Configure how the storefront introduces itself across every customer
            touchpoint.
          </p>
        </div>

        <FormField
          label="Shop name"
          htmlFor="shop-name"
          error={buildErrorNode("shop-name-error", nameError)}
        >
          <Input
            id="shop-name"
            name="name"
            value={info.name}
            onChange={(event) => onInfoChange("name", event.target.value)}
            placeholder="Maison de Luxe"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "shop-name-error" : undefined}
          />
        </FormField>

        <FormField
          label="Theme preset"
          htmlFor="shop-theme-id"
          error={buildErrorNode("shop-theme-error", themeError)}
        >
          <Input
            id="shop-theme-id"
            name="themeId"
            value={info.themeId}
            onChange={(event) => onInfoChange("themeId", event.target.value)}
            placeholder="bcd-classic"
            aria-invalid={themeError ? true : undefined}
            aria-describedby={themeError ? "shop-theme-error" : undefined}
          />
        </FormField>

        <FormField
          label="Luxury features"
          error={buildErrorNode("luxury-features-error", luxuryError)}
        >
          <div className="space-y-3">
            {FEATURE_TOGGLES.map((feature) => {
              const checkboxId = `luxury-feature-${feature.key}`;
              const descriptionId = `${checkboxId}-description`;
              const checked = Boolean(info.luxuryFeatures?.[feature.key]);
              return (
                <label
                  key={feature.key}
                  htmlFor={checkboxId}
                  className="flex items-start gap-3 rounded-md border border-border/60 bg-surface-3 px-3 py-2"
                >
                  <Checkbox
                    id={checkboxId}
                    name={feature.key}
                    value="on"
                    checked={checked}
                    onCheckedChange={(state) =>
                      onLuxuryFeatureChange(
                        feature.key,
                        (state === true) as Shop["luxuryFeatures"][typeof feature.key],
                      )
                    }
                    aria-describedby={descriptionId}
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-medium text-foreground">
                      {feature.label}
                    </span>
                    <span
                      id={descriptionId}
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
              error={buildErrorNode("luxury-fraud-error", fraudError)}
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
                    Number(event.target.value) as Shop["luxuryFeatures"]["fraudReviewThreshold"],
                  )
                }
                aria-invalid={fraudError ? true : undefined}
                aria-describedby={fraudError ? "luxury-fraud-error" : undefined}
              />
            </FormField>
          </div>
        </FormField>
      </CardContent>
    </Card>
  );
}
