"use client";

import { Card, CardContent, Checkbox, FormField } from "@ui";
import type { Provider } from "@acme/configurator/providers";

export type ProvidersSectionErrors = Partial<
  Record<"trackingProviders", string[]>
>;

export interface ProvidersSectionProps {
  values: readonly string[];
  providers: readonly Provider[];
  errors?: ProvidersSectionErrors;
  onChange: (next: string[]) => void;
}

function formatError(messages?: string[]) {
  return messages && messages.length > 0 ? messages.join("; ") : undefined;
}

export default function ProvidersSection({
  values,
  providers,
  errors,
  onChange,
}: ProvidersSectionProps) {
  const handleToggle = (providerId: string, checked: boolean) => {
    const current = new Set(values);
    if (checked) {
      current.add(providerId);
    } else {
      current.delete(providerId);
    }
    onChange(Array.from(current));
  };

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
          error={formatError(errors?.trackingProviders)}
        >
          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No shipping providers available for this shop.
            </p>
          ) : (
            <div className="space-y-2">
              {providers.map((provider) => {
                const id = `provider-${provider.id}`;
                const checked = values.includes(provider.id);
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
