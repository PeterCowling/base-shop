"use client";

import { Card, CardContent, Checkbox } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import type { Provider } from "@acme/configurator/providers";
import { useTranslations } from "@acme/i18n";

export type ShopProvidersSectionErrors = Partial<
  Record<"trackingProviders", string[]>
>;

export interface ShopProvidersSectionProps {
  readonly trackingProviders: readonly string[];
  readonly shippingProviders: readonly Provider[];
  readonly errors?: ShopProvidersSectionErrors;
  readonly onTrackingChange: (next: string[]) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopProvidersSection({
  trackingProviders,
  shippingProviders,
  errors,
  onTrackingChange,
}: ShopProvidersSectionProps) {
  const t = useTranslations();
  const handleToggle = (providerId: string, checked: boolean) => {
    const current = new Set(trackingProviders);
    if (checked) {
      current.add(providerId);
    } else {
      current.delete(providerId);
    }
    onTrackingChange(Array.from(current));
  };

  const errorMessage = formatError(errors?.trackingProviders);
  const errorId = errorMessage ? "tracking-providers-error" : undefined;

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{t("Logistics providers")}</h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Select the shipping plugins that should push tracking events into CRM dashboards."
            )}
          </p>
        </div>

        <FormField
          label={t("Tracking providers")}
          error={
            errorMessage ? (
              <span
                id={errorId}
                role="alert"
                aria-label={errorMessage}
              >
                {errorMessage}
              </span>
            ) : undefined
          }
        >
          {shippingProviders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("No shipping providers available for this shop.")}
            </p>
          ) : (
            <div className="space-y-2">
              {shippingProviders.map((provider) => {
                const id = `provider-${provider.id}`;
                const checked = trackingProviders.includes(provider.id);
                return (
                  <label
                    key={provider.id}
                    htmlFor={id}
                    className="flex items-center gap-3 rounded-md border border-border/60 bg-surface-3 px-3 py-2"
                  >
                    <Checkbox
                      id={id}
                      name={"trackingProviders" /* i18n-exempt: technical form field name */}
                      value={provider.id}
                      checked={checked}
                      onCheckedChange={(state) =>
                        handleToggle(provider.id, state === true)
                      }
                      aria-describedby={errorId}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {provider.name}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </FormField>
      </CardContent>
    </Card>
  );
}
