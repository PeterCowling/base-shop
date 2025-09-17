"use client";

import {
  Card,
  CardContent,
  Checkbox,
} from "@/components/atoms/shadcn";
import { FormField } from "@/components/molecules/FormField";
import type { Provider } from "@acme/configurator/providers";

export type ShopProvidersErrors = Partial<Record<"trackingProviders", string[]>>;

export interface ShopProvidersSectionProps {
  selected: readonly string[];
  providers: readonly Provider[];
  errors?: ShopProvidersErrors | Record<string, string[]>;
  onChange: (next: string[]) => void;
}

function formatError(
  errors: ShopProvidersSectionProps["errors"],
  key: "trackingProviders",
) {
  if (!errors) return undefined;
  const messages = errors[key];
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ShopProvidersSection({
  selected,
  providers,
  errors,
  onChange,
}: ShopProvidersSectionProps) {
  const handleToggle = (providerId: string, checked: boolean) => {
    const current = new Set(selected);
    if (checked) {
      current.add(providerId);
    } else {
      current.delete(providerId);
    }
    onChange(Array.from(current));
  };

  const providersError = formatError(errors, "trackingProviders");

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Logistics providers</h3>
          <p className="text-sm text-muted-foreground">
            Select the shipping plugins that should push tracking events into CRM dashboards.
          </p>
        </div>

        <FormField
          label="Tracking providers"
          error={
            providersError && <span role="alert">{providersError}</span>
          }
        >
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shipping providers available for this shop.
            </p>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => {
                const id = `provider-${provider.id}`;
                const checked = selected.includes(provider.id);
                return (
                  <label
                    key={provider.id}
                    htmlFor={id}
                    className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2"
                  >
                    <Checkbox
                      id={id}
                      name="trackingProviders"
                      value={provider.id}
                      checked={checked}
                      onCheckedChange={(state) =>
                        handleToggle(provider.id, state === true)
                      }
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
