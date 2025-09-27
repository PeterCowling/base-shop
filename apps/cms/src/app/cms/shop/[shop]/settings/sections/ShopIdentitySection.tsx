"use client";

import { useMemo } from "react";
import { useTranslations } from "@acme/i18n";
import type { Shop } from "@acme/types";
import {
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import type { IdentityField, LuxuryFeatureKey } from "../useShopEditorSubmit";

const FEATURE_KEYS = [
  "blog",
  "contentMerchandising",
  "raTicketing",
  "requireStrongCustomerAuth",
  "strictReturnConditions",
  "trackingDashboard",
  "premierDelivery",
] as const satisfies ReadonlyArray<
  Exclude<keyof Shop["luxuryFeatures"], "fraudReviewThreshold">
>;

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
    ...FEATURE_KEYS.map(
      (key) => `luxuryFeatures.${key}` as keyof ShopIdentitySectionErrors,
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
  const t = useTranslations();
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
          <h3 className="text-lg font-semibold">{t("Identity")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Configure how the storefront introduces itself across every customer touchpoint.",
            )}
          </p>
        </div>

        <FormField
          label={String(t("Shop name"))}
          htmlFor="shop-name"
          error={buildErrorNode("shop-name-error", nameError)}
        >
          <Input
            id="shop-name"
            name="name"
            value={info.name}
            onChange={(event) => onInfoChange("name", event.target.value)}
            placeholder={String(t("Maison de Luxe"))}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "shop-name-error" : undefined}
          />
        </FormField>

        <FormField
          label={String(t("Theme preset"))}
          htmlFor={"shop-theme-id" /* i18n-exempt: technical control id */}
          error={buildErrorNode("shop-theme-error", themeError)}
        >
          <Input
            id={"shop-theme-id" /* i18n-exempt: technical control id */}
            name="themeId"
            value={info.themeId}
            onChange={(event) => onInfoChange("themeId", event.target.value)}
            placeholder={String(t("bcd-classic"))}
            aria-invalid={themeError ? true : undefined}
            aria-describedby={themeError ? "shop-theme-error" : undefined}
          />
        </FormField>

        <FormField
          label={String(t("Luxury features"))}
          error={buildErrorNode("luxury-features-error", luxuryError)}
        >
          <div className="space-y-3">
            {FEATURE_KEYS.map((key) => {
              const checkboxId = `luxury-feature-${key}`;
              const descriptionId = `${checkboxId}-description`;
              const checked = Boolean(info.luxuryFeatures?.[key]);
              const labelMap: Record<typeof FEATURE_KEYS[number], string> = {
                blog: String(t("Enable blog")),
                contentMerchandising: String(t("Content merchandising")),
                raTicketing: String(t("RA ticketing")),
                requireStrongCustomerAuth: String(
                  t("Require strong customer auth"),
                ),
                strictReturnConditions: String(t("Strict return conditions")),
                trackingDashboard: String(t("Tracking dashboard")),
                premierDelivery: String(t("Premier delivery")),
              };
              const descriptionMap: Record<typeof FEATURE_KEYS[number], string> = {
                blog: String(
                  t(
                    "Publish editorial stories powered by the CMS blog pipeline.",
                  ),
                ),
                contentMerchandising: String(
                  t(
                    "Unlock landing pages and style guides that spotlight collections.",
                  ),
                ),
                raTicketing: String(
                  t(
                    "Route boutique styling requests into the concierge ticket queue.",
                  ),
                ),
                requireStrongCustomerAuth: String(
                  t(
                    "Capture step-up authentication when high-risk orders are detected.",
                  ),
                ),
                strictReturnConditions: String(
                  t(
                    "Enforce detailed QC steps before inbound returns are accepted.",
                  ),
                ),
                trackingDashboard: String(
                  t(
                    "Surface live parcel updates for stylists inside the operations hub.",
                  ),
                ),
                premierDelivery: String(
                  t("Expose white-glove delivery windows for top-tier members."),
                ),
              };
              return (
                <label
                  key={key}
                  htmlFor={checkboxId}
                  className="flex items-start gap-3 rounded-md border border-border/60 bg-surface-3 px-3 py-2"
                >
                  <Checkbox
                    id={checkboxId}
                    name={key}
                    value="on"
                    checked={checked}
                    onCheckedChange={(state) =>
                      onLuxuryFeatureChange(
                        key,
                        (state === true) as Shop["luxuryFeatures"][typeof key],
                      )
                    }
                    aria-describedby={descriptionId}
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-medium text-foreground">
                      {labelMap[key]}
                    </span>
                    <span
                      id={descriptionId}
                      className="mt-1 block text-muted-foreground"
                    >
                      {descriptionMap[key]}
                    </span>
                  </span>
                </label>
              );
            })}
            <FormField
              label={String(t("Fraud review threshold"))}
              htmlFor={"luxury-fraud-threshold" /* i18n-exempt: technical control id */}
              error={buildErrorNode("luxury-fraud-error", fraudError)}
            >
              <Input
                id={"luxury-fraud-threshold" /* i18n-exempt: technical control id */}
                type="number"
                inputMode="numeric"
                name={"fraudReviewThreshold" /* i18n-exempt: technical field name */}
                value={info.luxuryFeatures.fraudReviewThreshold}
                min={0}
                onChange={(event) =>
                  onLuxuryFeatureChange(
                    "fraudReviewThreshold", // i18n-exempt: internal feature key
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
